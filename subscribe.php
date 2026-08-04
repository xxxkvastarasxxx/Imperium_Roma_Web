<?php
// subscribe.php — proxies newsletter signups to Brevo (Sendinblue) so the API key
// never reaches the browser. Works on IONOS shared hosting (PHP). Mirrors the
// config pattern used by send-telegram.php.

// ---------- Configuration sources ----------
// Preferred: set as environment vars in hosting (e.g., via .htaccess SetEnv)
$envKey    = getenv('BREVO_API_KEY') ?: '';
$envListId = getenv('BREVO_LIST_ID') ?: '';
$envDomain = getenv('ALLOWED_DOMAIN') ?: '';

// Fallback: local config file (never commit real secrets to VCS)
$localKey = '';
$localListId = '';
$localDomain = '';
$configPath = __DIR__ . '/config/newsletter.php';
if (!$envKey || !$envListId) {
  if (is_file($configPath)) {
    $cfg = include $configPath; // must return ['apiKey' => '...', 'listId' => '...', 'allowedDomain' => '...']
    if (is_array($cfg)) {
      $localKey    = isset($cfg['apiKey'])        ? (string)$cfg['apiKey']        : '';
      $localListId = isset($cfg['listId'])         ? (string)$cfg['listId']        : '';
      $localDomain = isset($cfg['allowedDomain'])  ? (string)$cfg['allowedDomain'] : '';
    }
  }
}

$BREVO_API_KEY  = $envKey    ?: $localKey;
$BREVO_LIST_ID  = $envListId ?: $localListId;
$ALLOWED_DOMAIN = $envDomain ?: $localDomain ?: 'https://imperiumroma.com';

// ---------- Helpers ----------
function respond($status, $payload) {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($payload);
  exit;
}

// ---------- Guardrails ----------
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header('X-Frame-Options: DENY');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  respond(405, ['success' => false, 'error' => 'Method not allowed']);
}

if (!function_exists('curl_init')) {
  respond(500, ['success' => false, 'error' => 'Server error: PHP cURL extension is not available.']);
}

// Same-origin allowlist check (Origin/Referer are attacker-controllable for non-browser
// clients, but this still blocks casual cross-site abuse; browsers themselves already
// block cross-origin reads of the JSON response since we send no CORS headers).
$allowedHosts = array_filter(array_map(
  fn($d) => parse_url(trim($d), PHP_URL_HOST) ?: trim($d),
  array_merge(explode(',', $ALLOWED_DOMAIN), ['127.0.0.1', 'localhost'])
));
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$referer = $_SERVER['HTTP_REFERER'] ?? '';
$originOk = true; // default allow if no headers (e.g. same-origin fetch without Origin on old browsers)
foreach ([$origin, $referer] as $h) {
  if ($h) {
    $host = parse_url($h, PHP_URL_HOST);
    if ($host && !in_array($host, $allowedHosts, true)) { $originOk = false; break; }
  }
}
if (!$originOk) {
  respond(403, ['success' => false, 'error' => 'Forbidden: invalid origin.']);
}

if (!$BREVO_API_KEY || !$BREVO_LIST_ID) {
  respond(500, ['success' => false, 'error' => 'Server configuration incomplete.']);
}

// ---------- Input parsing & validation ----------
$raw  = file_get_contents('php://input');
$json = json_decode($raw, true) ?: [];
$email = trim((string)($json['email'] ?? ($_POST['email'] ?? '')));

if ($email === '') {
  respond(400, ['success' => false, 'error' => 'Email is required.']);
}
if (strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
  respond(400, ['success' => false, 'error' => 'Please provide a valid email address.']);
}

// Simple per-IP rate limiting (5 submissions/hour)
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$bucket = sha1('newsletter-rate-' . $ip);
$rateFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'ir_rate_' . $bucket . '.json';
$now = time();
$window = 3600; // 1 hour
$limit = 5;
$list = [];
if (is_file($rateFile)) {
  $rawRate = @file_get_contents($rateFile);
  $list = $rawRate ? (json_decode($rawRate, true) ?: []) : [];
}
$list = array_values(array_filter($list, function ($t) use ($now, $window) {
  return is_int($t) && ($now - $t) < $window;
}));
if (count($list) >= $limit) {
  respond(429, ['success' => false, 'error' => 'Too many attempts. Please try again later.']);
}
$list[] = $now;
@file_put_contents($rateFile, json_encode($list));

// ---------- Call Brevo API ----------
$ch = curl_init('https://api.brevo.com/v3/contacts');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  'accept: application/json',
  'content-type: application/json',
  'api-key: ' . $BREVO_API_KEY,
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
  'email' => $email,
  'listIds' => [(int)$BREVO_LIST_ID],
  'updateEnabled' => true,
]));
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
curl_setopt($ch, CURLOPT_TIMEOUT, 20);

$envCa = getenv('CURL_CAFILE') ?: '';
$localCa = __DIR__ . '/config/cacert.pem';
if ($envCa && is_file($envCa)) {
  curl_setopt($ch, CURLOPT_CAINFO, $envCa);
} elseif (is_file($localCa)) {
  curl_setopt($ch, CURLOPT_CAINFO, $localCa);
}

$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err  = curl_error($ch);
curl_close($ch);

if ($code === 201 || $code === 204) {
  respond(200, ['success' => true]);
}

$desc = '';
$parsed = json_decode((string)$resp, true);
if (isset($parsed['message'])) { $desc = $parsed['message']; }
error_log('subscribe.php Brevo error: HTTP ' . $code . ' ' . ($desc ?: $err ?: $resp));
respond(502, ['success' => false, 'error' => 'Subscription service unavailable. Please try again later.']);

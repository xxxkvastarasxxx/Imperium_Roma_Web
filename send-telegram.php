<?php
// send-telegram.php — forwards contact form submissions to a Telegram chat/group
// Works on IONOS shared hosting (PHP). No third-party services required.

// ---------- Configuration sources ----------
// Preferred: set as environment vars in hosting (e.g., via .htaccess SetEnv)
$envToken = getenv('TELEGRAM_BOT_TOKEN') ?: '';
$envChat  = getenv('TELEGRAM_CHAT_ID')   ?: '';

// Fallback: local config file (never commit real secrets to VCS)
$localToken = '';
$localChat  = '';
$configPath = __DIR__ . '/config/telegram.php';
if (!$envToken || !$envChat) {
  if (is_file($configPath)) {
    $cfg = include $configPath; // must return ['botToken' => '...', 'chatId' => '...']
    if (is_array($cfg)) {
      $localToken = isset($cfg['botToken']) ? (string)$cfg['botToken'] : '';
      $localChat  = isset($cfg['chatId'])   ? (string)$cfg['chatId']   : '';
    }
  }
}

$BOT_TOKEN = $envToken ?: $localToken;
$CHAT_ID   = $envChat  ?: $localChat; // group IDs are negative, e.g., -100xxxxxxxxxx

// ---------- Helpers ----------
function wants_json(): bool {
  if (!empty($_SERVER['HTTP_ACCEPT']) && stripos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) return true;
  if (!empty($_SERVER['CONTENT_TYPE']) && stripos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) return true;
  if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') return true;
  return false;
}

// Safe string length (works without mbstring)
function safe_len(string $s): int {
  if (function_exists('mb_strlen')) { return (int) mb_strlen($s, 'UTF-8'); }
  return strlen($s);
}

function respond($status, $payload) {
  http_response_code($status);
  if (wants_json()) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload);
  } else {
    header('Content-Type: text/html; charset=utf-8');
    $msg = htmlspecialchars($payload['message'] ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $ok  = !empty($payload['success']);
    echo '<!doctype html><html><head><meta charset="utf-8"><title>Contact Form</title><meta name="viewport" content="width=device-width, initial-scale=1">'
       . '<style>body{font-family:Arial,sans-serif;background:#0b0b0b;color:#e9ecef;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px} .card{background:#111;border:1px solid #222;border-radius:12px;max-width:640px;width:100%;padding:24px;box-shadow:0 10px 30px rgba(0,0,0,.3)} h1{margin:0 0 8px} .ok{color:#5cff96} .err{color:#ff6b6b} a{color:#ffcc00;text-decoration:none}</style></head><body>'
       . '<div class="card">'
       . '<h1>' . ($ok ? 'Thank you!' : 'Submission error') . '</h1>'
       . '<p class="' . ($ok ? 'ok' : 'err') . '">' . $msg . '</p>'
       . '<p><a href="/contact/">Back to contact</a></p>'
       . '</div></body></html>';
  }
  exit;
}

function sendTelegramRequest(string $method, array $fields, string $botToken) {
  $url = "https://api.telegram.org/bot{$botToken}/{$method}";
  $ch = curl_init($url);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_POST, true);
  curl_setopt($ch, CURLOPT_POSTFIELDS, $fields);
  curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
  curl_setopt($ch, CURLOPT_TIMEOUT, 20);

  // SSL configuration for local environments
  $envCa = getenv('CURL_CAFILE') ?: '';
  $localCa = __DIR__ . '/config/cacert.pem';
  if ($envCa && is_file($envCa)) {
    curl_setopt($ch, CURLOPT_CAINFO, $envCa);
  } elseif (is_file($localCa)) {
    curl_setopt($ch, CURLOPT_CAINFO, $localCa);
  }
  // Optional: allow disabling SSL verification for local dev only
  $insecure = strtolower((string)getenv('CURL_INSECURE'));
  if ($insecure === '1' || $insecure === 'true' || $insecure === 'yes') {
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
  }

  $resp = curl_exec($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $err  = curl_error($ch);
  curl_close($ch);
  return [$code, $resp, $err];
}

// ---------- Guardrails ----------
  // Security headers for responses
  header('X-Content-Type-Options: nosniff');
  header('Referrer-Policy: same-origin');
  header('X-Frame-Options: DENY');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  respond(405, ['success' => false, 'message' => 'Method Not Allowed']);
}

// Ensure required PHP extensions are available (helpful for local dev). Only needed for POST
if (!function_exists('curl_init')) {
  respond(500, ['success' => false, 'message' => 'Server error: PHP cURL extension is not available. Enable extension=curl in php.ini, then restart the server.']);
}

  // Basic same-origin allowlist check (helps against CSRF on static site)
  $allowedHosts = [
    'imperiumroma.com', 'www.imperiumroma.com',
    '127.0.0.1', 'localhost'
  ];
  $originOk = true; // default allow if no headers
  $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
  $referer = $_SERVER['HTTP_REFERER'] ?? '';
  foreach ([$origin, $referer] as $h) {
    if ($h) {
      $host = parse_url($h, PHP_URL_HOST);
      if ($host && !in_array($host, $allowedHosts, true)) { $originOk = false; break; }
    }
  }
  if (!$originOk) {
    respond(403, ['success' => false, 'message' => 'Forbidden: invalid origin.']);
  }

if (!$BOT_TOKEN || !$CHAT_ID) {
  respond(500, ['success' => false, 'message' => 'Server is not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID or config/telegram.php.']);
}

// Basic honeypot anti-spam (add a hidden input named "website" in your form)
if (!empty($_POST['website'])) {
  respond(200, ['success' => true, 'message' => 'Thanks!']); // silently accept
}

// ---------- Input parsing ----------
$ctype = $_SERVER['CONTENT_TYPE'] ?? '';
$data  = [];

if (stripos($ctype, 'application/json') !== false) {
  $raw = file_get_contents('php://input');
  $json = json_decode($raw, true) ?: [];
  $data['name']    = trim((string)($json['name'] ?? ''));
  $data['email']   = trim((string)($json['email'] ?? ''));
  $data['subject'] = trim((string)($json['subject'] ?? ''));
  $data['message'] = trim((string)($json['message'] ?? ''));
} else {
  $data['name']    = trim((string)($_POST['name'] ?? ''));
  $data['email']   = trim((string)($_POST['email'] ?? ''));
  $data['subject'] = trim((string)($_POST['subject'] ?? ''));
  $data['message'] = trim((string)($_POST['message'] ?? ''));
}

// ---------- Validation ----------
if ($data['name'] === '' || $data['email'] === '' || $data['message'] === '') {
  respond(400, ['success' => false, 'message' => 'Please fill out all required fields.']);
}
if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
  respond(400, ['success' => false, 'message' => 'Please provide a valid email address.']);
}

// Additional server-side limits and anti-spam
$nameRaw    = $data['name'];
$emailRaw   = $data['email'];
$subjectRaw = $data['subject'];
$messageRaw = $data['message'];

if (safe_len($nameRaw) > 80)   respond(400, ['success' => false, 'message' => 'Name is too long.']);
if (safe_len($emailRaw) > 254) respond(400, ['success' => false, 'message' => 'Email is too long.']);
if (safe_len($subjectRaw) > 80) respond(400, ['success' => false, 'message' => 'Subject is too long.']);
if (safe_len($messageRaw) < 10) respond(400, ['success' => false, 'message' => 'Message is too short.']);
if (safe_len($messageRaw) > 4000) respond(400, ['success' => false, 'message' => 'Message is too long.']);

$links = preg_match_all('~https?://~i', $messageRaw, $m);
if ($links !== false && $links > 3) {
  respond(400, ['success' => false, 'message' => 'Please reduce the number of links in your message.']);
}

$name    = htmlspecialchars($data['name'],    ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$email   = htmlspecialchars($data['email'],   ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$subject = htmlspecialchars($data['subject'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$message = htmlspecialchars($data['message'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

// Simple per-IP rate limiting (5 submissions/hour)
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$ipMasked = preg_replace('~(\d+)$~', 'xxx', $ip);
$bucket = sha1('contact-rate-' . $ip);
$rateFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'ir_rate_' . $bucket . '.json';
$now = time();
$window = 3600; // 1 hour
$limit = 5;     // max submissions per hour per IP
$list = [];
if (is_file($rateFile)) {
  $raw = @file_get_contents($rateFile);
  $list = $raw ? (json_decode($raw, true) ?: []) : [];
}
$list = array_values(array_filter($list, function($t) use ($now, $window) { return is_int($t) && ($now - $t) < $window; }));
if (count($list) >= $limit) {
  respond(429, ['success' => false, 'message' => 'Too many submissions. Please try again later.']);
}
$list[] = $now;
@file_put_contents($rateFile, json_encode($list));

// ---------- Send text message ----------
// Friendly subject mapping
$subjectMap = [
  'market evaluation' => 'Market Evaluation',
  'authenticity check' => 'Authenticity Check',
  'data parsing' => 'Data Parsing',
  'promote your lot' => 'Promote Your Lot',
  'custom request' => 'Custom Request',
];
$subjectPretty = $subjectMap[strtolower($subjectRaw)] ?? $subject;

$msgLines = [];
$msgLines[] = "\n<b>📨 New Contact Message</b>";
if ($subjectPretty !== '') { $msgLines[] = "\n<b>• Subject:</b> {$subjectPretty}"; }
$msgLines[] = "\n<b>• Name:</b> {$name}";
$msgLines[] = "\n<b>• Email:</b> {$email}";
$msgLines[] = "\n<b>• Sent:</b> " . gmdate('Y-m-d H:i:s') . ' GMT';
$msgLines[] = "\n<b>• IP:</b> {$ipMasked}";
$msgLines[] = "\n——————————————";
$msgLines[] = "\n<b>Message</b>:\n<pre>" . trim($message) . "</pre>";
$text = implode('', $msgLines);

list($code, $resp, $err) = sendTelegramRequest('sendMessage', [
  'chat_id'    => $CHAT_ID,
  'text'       => $text,
  'parse_mode' => 'HTML',
], $BOT_TOKEN);

if ($code !== 200) {
  $desc = ''; $parsed = json_decode($resp, true); if (isset($parsed['description'])) $desc = $parsed['description'];
  respond(502, ['success' => false, 'message' => 'Telegram error (sendMessage): ' . ($desc ?: $err ?: 'Unknown error')]);
}

// ---------- Send any attached files (optional) ----------
if (!empty($_FILES['file']) && is_array($_FILES['file']['name'])) {
  $names = $_FILES['file']['name'];
  $tmps  = $_FILES['file']['tmp_name'];
  $types = $_FILES['file']['type'];
  $errs  = $_FILES['file']['error'];
  $sizes = $_FILES['file']['size'];

  $count = min(count($names), 5); // safety cap
  $totalSize = 0;
  for ($i = 0; $i < $count; $i++) {
    if (!isset($errs[$i]) || $errs[$i] !== UPLOAD_ERR_OK) continue;
    if (!is_uploaded_file($tmps[$i])) continue;
    $fname = $names[$i];
    $mime  = $types[$i] ?: 'application/octet-stream';
    $size  = (int)($sizes[$i] ?? 0);
    $totalSize += $size;

    // MIME sniffing and allowlist (guard if fileinfo extension is missing)
    $realMime = $mime;
    if (function_exists('finfo_open')) {
      $finfo = @finfo_open(FILEINFO_MIME_TYPE);
      if ($finfo) {
        $det = @finfo_file($finfo, $tmps[$i]);
        if (is_string($det) && $det !== '') { $realMime = $det; }
        @finfo_close($finfo);
      }
    }
    $allowed = ['image/jpeg', 'image/png'];
    if (!in_array($realMime, $allowed, true)) continue;

    // Size limits
    if ($size <= 0 || $size > 10 * 1024 * 1024) continue; // per-file 10MB
    if ($totalSize > 12 * 1024 * 1024) break; // total up to ~12MB

    // Sanitize filename
    $safeName = preg_replace('~[^A-Za-z0-9._-]+~', '_', basename($fname));
    $file  = new CURLFile($tmps[$i], $realMime, $safeName);

    $caption = 'Attachment from ' . $name . ' — ' . $fname;
    list($c2, $r2, $e2) = sendTelegramRequest('sendDocument', [
      'chat_id'  => $CHAT_ID,
      'document' => $file,
      'caption'  => $caption,
    ], $BOT_TOKEN);
    // Soft-fail: continue even if an attachment fails
  }
}

respond(200, ['success' => true, 'message' => 'Message sent successfully!']);

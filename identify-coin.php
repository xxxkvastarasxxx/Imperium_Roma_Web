<?php
// identify-coin.php — AI identification of an ancient Roman coin from photos.
// The browser posts one or two downscaled photos (obverse, optional reverse);
// this endpoint asks Claude for a structured attribution and returns it as JSON.
// The API key lives only on the server (env var or config/anthropic.php).
// Prompt, schema and per-model request options: includes/coin-identify.php.

declare(strict_types=1);

use Anthropic\Client;
use Anthropic\Core\Exceptions\APIConnectionException;
use Anthropic\Core\Exceptions\APIStatusException;
use Anthropic\Core\Exceptions\AuthenticationException;
use Anthropic\Core\Exceptions\BadRequestException;
use Anthropic\Core\Exceptions\RateLimitException;

require __DIR__ . '/includes/coin-identify.php';

// ---------- Helpers ----------
function respond(int $status, array $payload): void {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

// Localised user-facing errors. The page sends its language; anything else gets English.
function msg(string $key, string $lang): string {
  static $m = [
    'en' => [
      'method'     => 'Method not allowed.',
      'origin'     => 'Forbidden.',
      'config'     => 'AI identification is temporarily unavailable. Please try again later.',
      'input'      => 'Please add a photo of the coin.',
      'image'      => 'One of the photos could not be read. Please upload a JPEG, PNG or WebP image.',
      'tooLarge'   => 'One of the photos is too large. Please use an image under 5 MB.',
      'rateIp'     => 'You have reached the limit for AI identifications. Please try again later.',
      'rateGlobal' => 'AI identification has reached its daily limit. Please try again tomorrow.',
      'busy'       => 'The AI service is busy right now. Please try again in a minute.',
      'failed'     => 'The identification could not be completed. Please try again.',
      'declined'   => 'These photos could not be analysed. Please upload clear photos of a coin.',
    ],
    'uk' => [
      'method'     => 'Метод не дозволено.',
      'origin'     => 'Доступ заборонено.',
      'config'     => 'ШІ-ідентифікація тимчасово недоступна. Спробуйте пізніше.',
      'input'      => 'Будь ласка, додайте фото монети.',
      'image'      => 'Не вдалося прочитати одне з фото. Завантажте зображення JPEG, PNG або WebP.',
      'tooLarge'   => 'Одне з фото завелике. Використайте зображення до 5 МБ.',
      'rateIp'     => 'Ви досягли ліміту ШІ-ідентифікацій. Спробуйте пізніше.',
      'rateGlobal' => 'ШІ-ідентифікація досягла денного ліміту. Спробуйте завтра.',
      'busy'       => 'Сервіс ШІ зараз перевантажений. Спробуйте за хвилину.',
      'failed'     => 'Не вдалося завершити ідентифікацію. Спробуйте ще раз.',
      'declined'   => 'Ці фото не вдалося проаналізувати. Завантажте чіткі фото монети.',
    ],
  ];
  return ($m[$lang] ?? $m['en'])[$key] ?? $m['en'][$key];
}

/**
 * Sliding-window counter in a temp file; returns false when the limit is hit.
 * $failOpen: what to do if the counter file can't be opened. Per-visitor
 * limits fail open (a broken temp dir must not take the feature down); the
 * site-wide spend cap fails closed (it must never silently disappear).
 */
function rate_take(string $bucket, int $window, int $limit, bool $failOpen = true): bool {
  $file = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'ir_rate_' . sha1($bucket) . '.json';
  $fh = @fopen($file, 'c+');
  if (!$fh) return $failOpen;
  flock($fh, LOCK_EX);
  $raw = stream_get_contents($fh);
  $now = time();
  $list = $raw ? (json_decode($raw, true) ?: []) : [];
  $list = array_values(array_filter($list, fn($t) => is_int($t) && ($now - $t) < $window));
  $ok = count($list) < $limit;
  if ($ok) {
    $list[] = $now;
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, json_encode($list));
  }
  flock($fh, LOCK_UN);
  fclose($fh);
  return $ok;
}

/** Decode a data: URL or bare base64 string into [mediaType, base64] after checking it is a real image. */
function parse_image($value): ?array {
  if (!is_string($value) || $value === '') return null;
  if (preg_match('~^data:[^;,]+;base64,(.+)$~s', $value, $m)) $value = $m[1];
  $value = preg_replace('~\s+~', '', $value);
  $bin = base64_decode($value, true);
  if ($bin === false || $bin === '') return null;
  if (strlen($bin) > 5 * 1024 * 1024) return ['tooLarge', ''];
  $info = @getimagesizefromstring($bin);
  $mime = is_array($info) ? ($info['mime'] ?? '') : '';
  if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true)) return null;
  return [$mime, base64_encode($bin)];
}

// ---------- Guardrails ----------
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header('X-Frame-Options: DENY');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  respond(405, ['success' => false, 'error' => msg('method', 'en')]);
}

// Size cap before reading the body: two downscaled photos are well under 4 MB;
// 16 MB leaves room for the 5 MB-per-photo limit plus base64 overhead.
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 16 * 1024 * 1024) {
  respond(413, ['success' => false, 'error' => msg('tooLarge', 'en')]);
}

$ctype = $_SERVER['CONTENT_TYPE'] ?? '';
$input = stripos($ctype, 'application/json') !== false
  ? (json_decode((string) file_get_contents('php://input', false, null, 0, 16 * 1024 * 1024), true) ?: [])
  : [];
$lang = ($input['lang'] ?? '') === 'uk' ? 'uk' : 'en';

// Same-origin allowlist (the endpoint spends API credit, so no cross-site use).
// Browsers always send Origin on a fetch() POST, so a request carrying neither
// Origin nor Referer is a script, not the page. (Both headers can be forged by a
// determined script; the rate limits and daily cap below are the real budget guard.)
$allowedHosts = ['imperiumroma.com', 'www.imperiumroma.com', '127.0.0.1', 'localhost'];
$sourceHeaders = array_filter([$_SERVER['HTTP_ORIGIN'] ?? '', $_SERVER['HTTP_REFERER'] ?? '']);
if (!$sourceHeaders) {
  respond(403, ['success' => false, 'error' => msg('origin', $lang)]);
}
foreach ($sourceHeaders as $h) {
  $host = parse_url($h, PHP_URL_HOST);
  if (!$host || !in_array($host, $allowedHosts, true)) {
    respond(403, ['success' => false, 'error' => msg('origin', $lang)]);
  }
}

// ---------- Configuration ----------
$apiKey = getenv('ANTHROPIC_API_KEY') ?: '';
$dailyLimit = 300;
$model = COIN_ID_DEFAULT_MODEL;
$configPath = __DIR__ . '/config/anthropic.php';
if (is_file($configPath)) {
  $cfg = include $configPath; // returns ['apiKey' => '...', 'model' => '...', 'dailyLimit' => 300]
  if (is_array($cfg)) {
    if (!$apiKey && !empty($cfg['apiKey'])) $apiKey = (string) $cfg['apiKey'];
    if (isset($cfg['dailyLimit'])) $dailyLimit = max(0, (int) $cfg['dailyLimit']);
    if (!empty($cfg['model'])) {
      if (in_array($cfg['model'], COIN_ID_MODELS, true)) {
        $model = $cfg['model'];
      } else {
        error_log('identify-coin: unknown model "' . $cfg['model'] . '" in config, using ' . $model);
      }
    }
  }
}
$autoload = __DIR__ . '/vendor/autoload.php';
// dailyLimit 0 is the off switch (not "unlimited"): an unbounded spend must never be one typo away.
if ($dailyLimit === 0) {
  respond(503, ['success' => false, 'error' => msg('config', $lang)]);
}
if (!$apiKey || str_contains($apiKey, 'YOUR_') || !is_file($autoload) || PHP_VERSION_ID < 80100) {
  error_log('identify-coin: not configured (key ' . ($apiKey ? 'set' : 'missing') . ', vendor '
    . (is_file($autoload) ? 'ok' : 'missing') . ', PHP ' . PHP_VERSION . ')');
  respond(503, ['success' => false, 'error' => msg('config', $lang)]);
}

// ---------- Input ----------
$images = [];
foreach (['obverse', 'reverse'] as $side) {
  if (!isset($input[$side]) || $input[$side] === '' || $input[$side] === null) continue;
  $img = parse_image($input[$side]);
  if ($img === null) respond(400, ['success' => false, 'error' => msg('image', $lang)]);
  if ($img[0] === 'tooLarge') respond(413, ['success' => false, 'error' => msg('tooLarge', $lang)]);
  $images[$side] = $img;
}
if (!$images) {
  respond(400, ['success' => false, 'error' => msg('input', $lang)]);
}

// ---------- Rate limits (checked after validation, so bad uploads don't use up a visitor's quota) ----------
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
// One IPv6 connection controls a whole /64 (billions of addresses), so IPv6
// visitors are limited per /64 block rather than per address.
if (str_contains($ip, ':') && ($bin = @inet_pton($ip)) !== false && strlen($bin) === 16) {
  $ip = bin2hex(substr($bin, 0, 8)) . '::/64';
}
if (!rate_take('coin-id-hour-' . $ip, 3600, 6) || !rate_take('coin-id-day-' . $ip, 86400, 20)) {
  respond(429, ['success' => false, 'error' => msg('rateIp', $lang)]);
}
if (!rate_take('coin-id-global-' . gmdate('Y-m-d'), 86400, $dailyLimit, false)) {
  respond(429, ['success' => false, 'error' => msg('rateGlobal', $lang)]);
}

// ---------- Claude request ----------
require $autoload;

@set_time_limit(150);

try {
  $client = new Client(apiKey: $apiKey, requestOptions: ['timeout' => 90, 'maxRetries' => 1]);
  // Read & attribute, then check against the OCRE/CRRO catalogue (see includes/coin-identify.php)
  $run = coin_id_run($client, $model, $lang, $images);
} catch (RateLimitException $e) {
  error_log('identify-coin: rate limited by API: ' . $e->getMessage());
  respond(503, ['success' => false, 'error' => msg('busy', $lang)]);
} catch (AuthenticationException $e) {
  error_log('identify-coin: authentication failed — check the API key: ' . $e->getMessage());
  respond(503, ['success' => false, 'error' => msg('config', $lang)]);
} catch (BadRequestException $e) {
  error_log('identify-coin: bad request: ' . $e->getMessage());
  respond(502, ['success' => false, 'error' => msg('failed', $lang)]);
} catch (APIStatusException $e) {
  error_log('identify-coin: API error ' . ($e->status ?? '?') . ': ' . $e->getMessage());
  // 5xx / 529 overloaded: transient, worth retrying. Other 4xx: our request is wrong.
  respond(502, ['success' => false, 'error' => msg(($e->status ?? 0) >= 500 ? 'busy' : 'failed', $lang)]);
} catch (APIConnectionException $e) {
  error_log('identify-coin: connection/timeout: ' . $e->getMessage());
  respond(504, ['success' => false, 'error' => msg('busy', $lang)]);
} catch (\Throwable $e) {
  error_log('identify-coin: unexpected ' . get_class($e) . ': ' . $e->getMessage());
  respond(500, ['success' => false, 'error' => msg('failed', $lang)]);
}

// ---------- Response ----------
if ($run['stop'] === 'refusal') {
  respond(422, ['success' => false, 'error' => msg('declined', $lang)]);
}
if ($run['result'] === null) {
  error_log('identify-coin: no usable result (stop: ' . $run['stop'] . ')');
  respond(502, ['success' => false, 'error' => msg('failed', $lang)]);
}

respond(200, ['success' => true, 'result' => $run['result']]);

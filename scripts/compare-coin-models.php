<?php
// Compare the AI coin identification across Claude models on your own photos,
// using exactly the request the website sends (includes/coin-identify.php).
//
// Usage (needs PHP 8.1+, `composer install`, and an API key):
//   ANTHROPIC_API_KEY=sk-ant-... php scripts/compare-coin-models.php [options] COIN [COIN ...]
//
//   COIN       obverse.jpg            one side
//              obverse.jpg+reverse.jpg  both sides
//   --lang=uk  answer language (default en)
//   --models=claude-sonnet-5-5,claude-haiku-4-5   subset to run (default: all)
//   --out=file.json  where to save the full answers (default compare-results.json)
//
// Every coin is sent once per model, so this spends real API credit: roughly
// $0.01–0.10 per coin per model. Photos must be JPEG/PNG/WebP under 5 MB.

declare(strict_types=1);

use Anthropic\Client;

if (PHP_SAPI !== 'cli') { http_response_code(404); exit; } // command-line tool only

$root = dirname(__DIR__);
require $root . '/includes/coin-identify.php';
if (!is_file($root . '/vendor/autoload.php')) {
  fwrite(STDERR, "vendor/ missing: run `composer install` in the project root first.\n");
  exit(1);
}
require $root . '/vendor/autoload.php';

$lang = 'en';
$models = COIN_ID_MODELS;
$outFile = 'compare-results.json';
$coins = [];
foreach (array_slice($argv, 1) as $arg) {
  if (str_starts_with($arg, '--lang=')) $lang = substr($arg, 7) === 'uk' ? 'uk' : 'en';
  elseif (str_starts_with($arg, '--models=')) $models = array_values(array_intersect(explode(',', substr($arg, 9)), COIN_ID_MODELS));
  elseif (str_starts_with($arg, '--out=')) $outFile = substr($arg, 6);
  else $coins[] = $arg;
}

$apiKey = getenv('ANTHROPIC_API_KEY') ?: '';
if (!$apiKey && is_file($root . '/config/anthropic.php')) {
  $cfg = include $root . '/config/anthropic.php';
  $apiKey = is_array($cfg) ? (string) ($cfg['apiKey'] ?? '') : '';
}
if (!$coins || !$models || !$apiKey || str_contains($apiKey, 'YOUR_')) {
  fwrite(STDERR, "Usage: php scripts/compare-coin-models.php [--lang=uk] [--models=a,b] obverse.jpg[+reverse.jpg] ...\n"
    . "Needs ANTHROPIC_API_KEY (or config/anthropic.php). Models: " . implode(', ', COIN_ID_MODELS) . "\n");
  exit(1);
}

function load_side(string $path): array {
  if (!is_file($path)) throw new RuntimeException("not found: $path");
  if (filesize($path) > 5 * 1024 * 1024) throw new RuntimeException("over 5 MB, resize it first: $path");
  $mime = (getimagesize($path) ?: [])['mime'] ?? '';
  if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true)) throw new RuntimeException("not a JPEG/PNG/WebP: $path");
  return [$mime, base64_encode((string) file_get_contents($path))];
}

$client = new Client(apiKey: $apiKey, requestOptions: ['timeout' => 180, 'maxRetries' => 2]);
$results = [];
$totals = array_fill_keys($models, ['cost' => 0.0, 'seconds' => 0.0, 'runs' => 0]);

foreach ($coins as $coin) {
  $paths = explode('+', $coin);
  try {
    $images = ['obverse' => load_side($paths[0])];
    if (isset($paths[1])) $images['reverse'] = load_side($paths[1]);
  } catch (RuntimeException $e) {
    fwrite(STDERR, "skip $coin: {$e->getMessage()}\n");
    continue;
  }
  echo "\n=== $coin\n";
  foreach ($models as $model) {
    $t0 = microtime(true);
    try {
      $run = coin_id_run($client, $model, $lang, $images); // same pipeline as the website
    } catch (\Throwable $e) {
      echo sprintf("  %-18s ERROR %s\n", $model, $e->getMessage());
      $results[$coin][$model] = ['error' => $e->getMessage()];
      continue;
    }
    $secs = microtime(true) - $t0;
    [$pin, $pout] = COIN_ID_PRICES[$model];
    [$in, $out] = $run['usage'];
    $cost = ($in * $pin + $out * $pout) / 1e6;
    $r = $run['result'];
    $totals[$model]['cost'] += $cost;
    $totals[$model]['seconds'] += $secs;
    $totals[$model]['runs']++;
    $results[$coin][$model] = ['result' => $r, 'stop' => $run['stop'], 'calls' => $run['calls'],
      'seconds' => round($secs, 1), 'input_tokens' => $in, 'output_tokens' => $out, 'usd' => round($cost, 4)];
    $cat = $r['catalogue'] ?? null;
    echo sprintf("  %-18s %-6s %5.1fs  $%.4f  %s%s\n", $model,
      $r['confidence'] ?? '-', $secs, $cost,
      $r['summary'] ?? ('[' . $run['stop'] . ']'),
      !empty($r['references']) ? '  [' . implode('; ', $r['references']) . ']' : '');
    if ($cat) {
      echo sprintf("  %-18s catalogue: %s, %d types compared%s\n", '', $cat['status'], $cat['checked'],
        $cat['matches'] ? ' -> ' . implode('; ', array_map(fn($m) => $m['id'] . ' (' . $m['confidence'] . ')', $cat['matches'])) : '');
    }
  }
}

echo "\n=== Totals\n";
foreach ($totals as $model => $t) {
  if (!$t['runs']) continue;
  echo sprintf("  %-18s %d coins  avg %.1fs  avg $%.4f/coin  total $%.4f\n",
    $model, $t['runs'], $t['seconds'] / $t['runs'], $t['cost'] / $t['runs'], $t['cost']);
}
file_put_contents($outFile, json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
echo "\nFull answers saved to $outFile\n";

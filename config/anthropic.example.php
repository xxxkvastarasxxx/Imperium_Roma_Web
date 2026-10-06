<?php
/**
 * Claude API configuration template (AI coin identification, /identify-coin.php)
 *
 * INSTRUCTIONS:
 * 1. Copy this file to anthropic.php (in the same directory) ON THE SERVER
 * 2. Replace the placeholder with a real API key from https://console.anthropic.com
 * 3. NEVER commit anthropic.php to version control (it is in .gitignore)
 *
 * Alternatively set ANTHROPIC_API_KEY as an environment variable in hosting;
 * the environment variable wins over this file.
 *
 * model picks the Claude model (roughly, per identification):
 *   'claude-opus-5-5'    most accurate, ~$0.05–0.10
 *   'claude-sonnet-5-5'  ~$0.02–0.04
 *   'claude-haiku-4-5'   default, cheapest, ~$0.01, weakest on worn legends
 * Compare them on your own coins first: scripts/compare-coin-models.php
 *
 * dailyLimit caps how many identifications the whole site runs per day
 * (UTC), as a guard on API spend if the endpoint is abused. Each request is
 * one Claude call with up to two photos.
 */

return [
    'apiKey'     => 'YOUR_ANTHROPIC_API_KEY_HERE', // sk-ant-...
    'model'      => 'claude-haiku-4-5',
    'dailyLimit' => 300,
];

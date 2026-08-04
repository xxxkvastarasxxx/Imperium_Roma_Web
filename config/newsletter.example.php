<?php
/**
 * Newsletter Configuration Template
 *
 * INSTRUCTIONS:
 * 1. Copy this file to newsletter.php (in the same directory)
 * 2. Replace the placeholder values with your real Brevo credentials
 * 3. NEVER commit newsletter.php to version control (it's already .gitignored)
 *
 * Preferred alternative: set BREVO_API_KEY / BREVO_LIST_ID / ALLOWED_DOMAIN as
 * environment variables in your hosting panel instead of using this file —
 * subscribe.php checks those first.
 *
 * To get an API key:
 * - https://app.brevo.com/settings/keys/api
 *
 * To get your list ID:
 * - https://app.brevo.com/contact/list (numeric value, e.g. 2, 5, 12)
 */

return [
    'apiKey'        => 'YOUR_BREVO_API_KEY_HERE',   // e.g., xkeysib-...
    'listId'        => 'YOUR_LIST_ID_HERE',         // e.g., 2
    'allowedDomain' => 'https://imperiumroma.com',  // comma-separate for multiple, e.g. "https://imperiumroma.com,https://www.imperiumroma.com"
];

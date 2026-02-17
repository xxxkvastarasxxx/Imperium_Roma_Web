<?php
/**
 * Newsletter Configuration Example
 * 
 * This file serves as a reference for the configuration values
 * used in subscribe.php. Do NOT use this file directly - instead,
 * edit subscribe.php in the root directory.
 */

// Your Brevo API Key
// Get this from: https://app.brevo.com/settings/keys/api
define('BREVO_API_KEY', 'xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');

// Your Brevo Contact List ID
// Get this from: https://app.brevo.com/contact/list
// This should be a numeric value, e.g., 2, 5, 12, etc.
define('BREVO_LIST_ID', '2');

// Your domain (for CORS protection)
// This ensures only requests from your domain can use the API
define('ALLOWED_DOMAIN', 'https://imperiumroma.com');

/**
 * Example API Request to Brevo:
 * 
 * POST https://api.brevo.com/v3/contacts
 * Headers:
 *   - accept: application/json
 *   - content-type: application/json
 *   - api-key: YOUR_API_KEY
 * 
 * Body:
 * {
 *   "email": "user@example.com",
 *   "listIds": [2],
 *   "updateEnabled": true
 * }
 */

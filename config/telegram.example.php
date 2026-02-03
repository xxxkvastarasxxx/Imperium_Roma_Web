<?php
/**
 * Telegram API Configuration Template
 * 
 * INSTRUCTIONS:
 * 1. Copy this file to telegram.php (in the same directory)
 * 2. Replace the placeholder values with your real credentials
 * 3. NEVER commit telegram.php to version control
 * 
 * To get a bot token:
 * - Message @BotFather on Telegram
 * - Send /newbot and follow the prompts
 * 
 * To get your chat ID:
 * - Add your bot to the group/channel
 * - Send a message in the group
 * - Visit: https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
 * - Look for "chat":{"id": ...} in the response
 */

return [
    'botToken' => 'YOUR_BOT_TOKEN_HERE',  // e.g., 123456789:ABCdefGhIJKlmnOPQRstUVWxyz
    'chatId'   => 'YOUR_CHAT_ID_HERE',    // e.g., -1001234567890 (negative for groups)
];

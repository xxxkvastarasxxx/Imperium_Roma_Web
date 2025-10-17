const fetch = require('node-fetch');

// Handler function for the serverless environment
exports.handler = async (event) => {
  // --- Environment Variables ---
  // Securely access your Telegram Bot Token and Chat ID from environment variables.
  // These must be configured in your hosting provider's settings (e.g., Netlify, Vercel).
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;

  // --- Pre-flight check ---
  // Ensure the required environment variables are set.
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server configuration error: Bot Token or Chat ID is missing.' }),
    };
  }

  // --- Security Check ---
  // Only allow POST requests to this function.
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
      headers: { 'Allow': 'POST' },
    };
  }

  try {
    // --- Parse Incoming Data ---
    // The form data is sent as a JSON string in the request body.
    const { name, email, message } = JSON.parse(event.body);

    // --- Basic Validation ---
    // Ensure all required fields are present.
    if (!name || !email || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Bad Request: Name, email, and message are required.' }),
      };
    }

    // --- Format the Message for Telegram ---
    // Create a clean, readable message format. Using Markdown for formatting.
    const text = `
*New Contact Form Submission*

*Name:* ${name}
*Email:* ${email}
*Message:*
${message}
    `;

    // --- Telegram API Request ---
    // Construct the URL for the Telegram Bot API's sendMessage method.
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    // Prepare the payload to be sent to Telegram.
    const payload = {
      chat_id: TELEGRAM_CHAT_ID,
      text: text,
      parse_mode: 'Markdown', // Use 'Markdown' or 'HTML' for rich text formatting.
    };

    // Send the message using node-fetch.
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // --- Handle Telegram's Response ---
    const telegramResponse = await response.json();

    if (!telegramResponse.ok) {
      // If Telegram reports an error, log it and return a server error.
      console.error('Telegram API Error:', telegramResponse.description);
      return {
        statusCode: 502, // Bad Gateway, as we received an invalid response from an upstream server.
        body: JSON.stringify({ message: `Failed to send message. Telegram API error: ${telegramResponse.description}` }),
      };
    }

    // --- Success Response ---
    // If the message is sent successfully, return a 200 OK response.
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Message sent successfully!' }),
    };

  } catch (error) {
    // --- Error Handling ---
    // Catch any other errors (e.g., JSON parsing, network issues).
    console.error('Handler Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'An internal server error occurred.' }),
    };
  }
};

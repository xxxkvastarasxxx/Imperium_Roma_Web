# Newsletter Subscription System - Configuration Guide

## Overview
A secure newsletter subscription system using PHP proxy to protect your Brevo API credentials.

## Files Created/Modified

### New Files:
1. **subscribe.php** - PHP proxy for Brevo API (root directory)
2. **assets/js/newsletter.js** - Client-side subscription handler
3. **config/newsletter.example.php** - Configuration template (optional reference)

### Modified Files:
- All HTML pages with newsletter forms now have proper IDs
- All CSS files updated with message styles
- All pages include newsletter.js script

## Setup Instructions

### 1. Get Your Brevo Credentials

1. Go to [Brevo](https://www.brevo.com/) and log in to your account
2. Navigate to **Settings** → **API Keys**
3. Create a new API key or copy your existing one
4. Go to **Contacts** → **Lists** to find your list ID

### 2. Configure subscribe.php

Open `subscribe.php` in the root directory and replace these values:

```php
define('BREVO_API_KEY', 'YOUR_BREVO_API_KEY');  // Replace with your actual API key
define('BREVO_LIST_ID', 'YOUR_LIST_ID');        // Replace with your list ID (numeric)
define('ALLOWED_DOMAIN', 'https://imperiumroma.com'); // Your domain (already set)
```

**Important Security Notes:**
- Never commit the API key to public repositories
- Keep subscribe.php in your root directory
- The API key is never exposed to the browser
- CORS is restricted to your domain only

### 3. Test the Integration

1. Upload all files to IONOS
2. Visit any page with the newsletter form
3. Enter a test email address
4. Click "Subscribe"
5. Check your Brevo dashboard to confirm the contact was added

### 4. Troubleshooting

#### Error: "Server configuration incomplete"
- Check that you've replaced `YOUR_BREVO_API_KEY` and `YOUR_LIST_ID` with real values

#### Error: "Network error"
- Verify PHP cURL is enabled on your hosting
- Check that subscribe.php is accessible at `/subscribe.php`

#### Email not appearing in Brevo
- Verify the list ID is correct
- Check Brevo logs for failed API requests
- Ensure the API key has permission to add contacts

### 5. Customization

#### Change Success/Error Message Colors
Edit the CSS in these files:
- `assets/css/index.css`
- `assets/css/about.css`
- `assets/css/contact.css`
- `assets/css/authenticity.css`
- `assets/css/services.css`
- `assets/css/policies.css`

Look for `.newsletter-message.success` and `.newsletter-message.error`

#### Change Message Text
Edit `assets/js/newsletter.js` and modify these lines:
```javascript
showMessage(messageContainer, 'Thank you for subscribing!', 'success');
```

#### Add Analytics Tracking
The newsletter.js already includes Google Analytics event tracking. If using GA4, events will be automatically tracked when users subscribe.

## Features

✅ Secure API key protection (server-side only)  
✅ Client-side and server-side email validation  
✅ CORS protection (domain-restricted)  
✅ Styled success/error messages matching your theme  
✅ Loading state with disabled button  
✅ Auto-hide success messages after 5 seconds  
✅ Accessibility features (ARIA labels, screen reader support)  
✅ Analytics tracking (optional)  
✅ Works across all pages with newsletter forms  

## Support

If you encounter issues:
1. Check PHP error logs on IONOS
2. Check browser console for JavaScript errors
3. Verify Brevo API status at https://status.brevo.com/
4. Test the API key with Brevo's API explorer

## File Permissions

Ensure subscribe.php has proper permissions:
- IONOS typically requires 644 or 755 for PHP files
- Contact IONOS support if you get permission errors

# Newsletter Troubleshooting Guide

## 🔍 "Network Error" - Common Causes & Solutions

### Issue 1: Testing Locally (Not on Server)
**Symptom:** Error when opening HTML files directly from your computer (`file:///C:/Users/...`)

**Solution:**
- ✅ PHP only works on a web server, not local files
- Upload all files to IONOS and test at https://imperiumroma.com
- Or use a local PHP server (XAMPP, WAMP, or `php -S localhost:8000`)

**How to Check:**
- Open browser console (F12)
- Look for error: "Cannot reach subscribe.php. Please test on a web server"

---

### Issue 2: subscribe.php Not Uploaded
**Symptom:** 404 error or "Cannot reach subscribe.php"

**Solution:**
1. Verify subscribe.php is in your root directory on IONOS:
   ```
   public_html/
   ├── subscribe.php  ← Must be here!
   ├── index.html
   ├── assets/
   └── ...
   ```

2. Test subscribe.php directly:
   - Visit: `https://imperiumroma.com/subscribe.php`
   - Should show: `{"success":false,"error":"Method not allowed"}`
   - This confirms the file exists and PHP works

**If you get a 404:**
- Upload subscribe.php via FTP to your root directory
- Check file permissions (should be 644 or 755)

---

### Issue 3: CORS Issues
**Symptom:** Error in console: "CORS policy blocked"

**Solution:**
1. Check ALLOWED_DOMAIN in subscribe.php matches your actual domain:
   ```php
   define('ALLOWED_DOMAIN', 'https://imperiumroma.com'); // Must match!
   ```

2. If testing on subdomain or www:
   ```php
   // Option 1: Add www
   define('ALLOWED_DOMAIN', 'https://www.imperiumroma.com');
   
   // Option 2: Allow both (less secure)
   $allowed = ['https://imperiumroma.com', 'https://www.imperiumroma.com'];
   ```

---

### Issue 4: PHP Not Enabled on Server
**Symptom:** Download prompt or blank page when accessing subscribe.php

**Solution:**
1. Contact IONOS support to enable PHP
2. Verify PHP version (7.4+ recommended)
3. Ensure cURL extension is enabled

**Test PHP:**
Create `test.php` in root:
```php
<?php
phpinfo();
?>
```
Visit it in browser - should show PHP config. Delete after testing.

---

### Issue 5: Brevo API Issues
**Symptom:** Subscribe button works but shows server error

**Debug Steps:**

1. **Check Browser Console (F12):**
   ```javascript
   // Look for detailed error info:
   Newsletter subscription error: ...
   Error details: {...}
   ```

2. **Test subscribe.php directly with cURL:**
   ```bash
   curl -X POST https://imperiumroma.com/subscribe.php \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```
   
   Should return JSON (not HTML)

3. **Check Brevo Credentials:**
   - API key starts with `xkeysib-`
   - List ID is a number (e.g., `3`)
   - Test API key in Brevo dashboard

4. **Check Server Error Logs:**
   - IONOS control panel → Error Logs
   - Look for PHP errors related to subscribe.php

---

## 🛠️ Debugging Checklist

Run through these steps in order:

### Step 1: Verify File Upload ✅
- [ ] subscribe.php is in root directory on server
- [ ] Test URL: https://imperiumroma.com/subscribe.php
- [ ] Expected response: `{"success":false,"error":"Method not allowed"}`

### Step 2: Check Browser Console ✅
- [ ] Open your website
- [ ] Press F12 to open Developer Tools
- [ ] Go to "Console" tab
- [ ] Try subscribing and look for errors
- [ ] Check "Network" tab for failed requests

### Step 3: Verify Configuration ✅
- [ ] BREVO_API_KEY is set correctly in subscribe.php
- [ ] BREVO_LIST_ID matches your Brevo list
- [ ] ALLOWED_DOMAIN matches your actual domain

### Step 4: Test Email Validation ✅
- [ ] Try with valid email: test@example.com
- [ ] Check for client-side errors first

### Step 5: Check Brevo Dashboard ✅
- [ ] Log into Brevo
- [ ] Check if test emails appear in your list
- [ ] Check Brevo API logs for errors

---

## 📊 Common Error Messages Decoded

| Error Message | Meaning | Solution |
|--------------|---------|----------|
| "Network error. Please test on a web server" | Opening HTML file locally | Upload to server or use local PHP server |
| "Cannot reach subscribe.php" | File not found/not uploaded | Upload subscribe.php to root directory |
| "Method not allowed" | Accessed via GET instead of POST | This is normal - form should use POST |
| "Email is required" | Empty email field | Client-side validation should catch this |
| "Invalid email format" | Bad email address | Check email validation logic |
| "Server configuration incomplete" | API key = 'YOUR_BREVO_API_KEY' | Replace placeholder with real key |
| "Subscription service unavailable" | Brevo API error | Check API key, list ID, Brevo status |

---

## 🔧 Quick Fix Commands

### If using Git and subscribe.php isn't deployed:
```bash
# Upload subscribe.php via FTP separately (it's in .gitignore)
# Or temporarily remove from .gitignore, deploy, then re-add
```

### Test subscribe.php with browser DevTools:
```javascript
// Paste in browser console on your website:
fetch('/subscribe.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com' })
})
.then(r => r.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
```

### Enable detailed PHP errors (temporarily):
Add to top of subscribe.php:
```php
<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
// ... rest of code
```
**Remove this after debugging!**

---

## ✅ Success Indicators

You'll know it's working when:
1. ✅ Browser console shows no errors
2. ✅ Success message appears: "Thank you for subscribing!"
3. ✅ Email appears in Brevo dashboard
4. ✅ No network errors in DevTools Network tab

---

## 🆘 Still Not Working?

1. **Check these URLs directly:**
   - https://imperiumroma.com/subscribe.php (should show "Method not allowed")
   - https://imperiumroma.com/assets/js/newsletter.js (should show JS code)

2. **Send me the following info:**
   - Browser console error (screenshot or copy/paste)
   - Response from: https://imperiumroma.com/subscribe.php
   - Are you testing locally or on the server?
   - Which browser are you using?

3. **Temporary debug mode:**
   - I've added detailed console logging
   - Check browser console for "Error details" object
   - This will show the exact issue

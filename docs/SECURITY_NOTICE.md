# 🔐 IMPORTANT SECURITY NOTICE

## ⚠️ Before You Commit to Git!

Your **subscribe.php** file contains your **LIVE API KEY** and should **NEVER** be committed to a public repository.

### ✅ I've Added subscribe.php to .gitignore

But if you've already committed it before, you need to remove it from Git tracking:

```bash
git rm --cached subscribe.php
git commit -m "Remove subscribe.php from tracking (contains sensitive credentials)"
```

### 🚀 Safe Deployment Checklist

#### ✅ SECURE Deployment (Direct FTP/SFTP Upload):
1. Upload subscribe.php directly to IONOS via FTP/SFTP ✅
2. The file stays on the server only ✅
3. API key is safe ✅

#### ❌ INSECURE (Public Git Repository):
1. Push subscribe.php to GitHub/GitLab ❌
2. Your API key becomes public ❌
3. Anyone can use your Brevo account ❌

---

## 🔒 Security Confirmation

### What's Secure:
✅ **API Key is server-side only** - Never sent to browsers  
✅ **CORS protection** - Only https://imperiumroma.com can access  
✅ **Server-side validation** - Email validated before API call  
✅ **HTTPS enforced** - Secure connection required  
✅ **.gitignore updated** - subscribe.php won't be committed (from now on)

### How It Works:
1. User clicks "Subscribe" on your website
2. JavaScript sends email to `/subscribe.php` (on YOUR server)
3. PHP validates email and calls Brevo API with YOUR key
4. Browser NEVER sees the API key
5. User gets success/error message

### File Access:
- **Browser:** ❌ Cannot read subscribe.php source code
- **Your Server:** ✅ Executes PHP and returns JSON only
- **Git (if in .gitignore):** ❌ Won't be tracked
- **Direct server access:** ⚠️ Only you via FTP/SSH

---

## 📋 Deployment Methods

### Method 1: Direct FTP/SFTP (RECOMMENDED) ✅
Upload files directly to IONOS:
```
✅ subscribe.php (with real API key)
✅ assets/js/newsletter.js
✅ All HTML/CSS files
❌ Don't commit subscribe.php to Git
```

### Method 2: Git + Manual Config 🔶
If using Git deployment:
```bash
# On your server (SSH/FTP):
1. Deploy code via Git (subscribe.php will be missing)
2. Manually create subscribe.php on the server
3. Add your real API key directly on the server
```

### Method 3: Environment Variables (Advanced) 🔶
```php
// Instead of hardcoding in subscribe.php:
define('BREVO_API_KEY', getenv('BREVO_API_KEY'));
```
Then set environment variable in IONOS hosting panel.

---

## 🔍 Final Security Check

Before deploying, verify:

- [ ] subscribe.php is in .gitignore ✅ (Already done!)
- [ ] Your API key works in Brevo dashboard
- [ ] ALLOWED_DOMAIN matches your real domain
- [ ] You're using HTTPS (not HTTP)
- [ ] If using Git: subscribe.php is NOT in your repository
- [ ] If using FTP: subscribe.php uploads with real credentials

---

## ✅ You're Ready to Deploy!

**Your configuration is correct.** Just make sure you deploy securely:

- **IONOS via FTP/SFTP:** Upload everything ✅
- **Git to public repo:** Make sure subscribe.php isn't committed ✅

The API key will be **100% secure** on your server and **never visible** to website visitors. 🔒

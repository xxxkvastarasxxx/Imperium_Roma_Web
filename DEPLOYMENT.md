# 🚀 IONOS Deployment Setup Guide

This guide will help you set up automatic deployment from GitHub to your IONOS hosting.

---

## 📋 Prerequisites

- GitHub repository with your code
- IONOS Web Hosting Plus account
- FTP/SFTP credentials from IONOS

---

## 🔧 Method 1: GitHub Actions (Automated) - **RECOMMENDED**

### **Step 1: Get Your IONOS FTP Credentials**

1. Log in to your [IONOS Control Panel](https://my.ionos.com/)
2. Go to **Hosting** → **Your Package**
3. Find **FTP Access** or **SSH/SFTP Access**
4. Note down:
   - **FTP Server**: e.g., `ftp.yourdomain.com` or `access123456789.webspace-data.io`
   - **Username**: Your FTP username
   - **Password**: Your FTP password
   - **Port**: Usually `21` (FTP) or `22` (SFTP)

### **Step 2: Add Secrets to GitHub**

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add these three secrets:

   | Name | Value |
   |------|-------|
   | `FTP_SERVER` | Your IONOS FTP server address |
   | `FTP_USERNAME` | Your FTP username |
   | `FTP_PASSWORD` | Your FTP password |

### **Step 3: Server Directory Configuration**

The workflow file is at `.github/workflows/deploy.yml`. The `server-dir` is set to `/Imperium_Roma/` which is where your domain points to on IONOS.

> **Important**: The deployment uses FTPS (FTP over TLS) on port 21. IONOS supports this by default.

The following files/folders are **excluded** from deployment (they only exist in the repo, not on the server):
- `.github/`, `.git*`, `.gitignore`
- `DEPLOYMENT.md`, `README.md`, `Imperium.png`
- `node_modules/`, `.vscode/`, `logs/`
- `config/telegram.php` (sensitive credentials)

### **Step 4: Deploy!**

Now whenever you push to the `main` branch:

```bash
git add .
git commit -m "Update website"
git push origin main
```

GitHub Actions will automatically deploy to IONOS!

You can also manually trigger deployment:
1. Go to your GitHub repository
2. Click **Actions** tab
3. Select **Deploy to IONOS** workflow
4. Click **Run workflow**

### **Step 5: Troubleshooting Protocol Issues**

If FTPS doesn't work on your IONOS hosting, you can try plain FTP by changing in `deploy.yml`:

```yaml
protocol: ftp    # Change from ftps to ftp
```

If you specifically need SFTP (port 22), you'll need to use a different action — see Troubleshooting section below.

---

## 🔧 Method 2: Git Deployment (If IONOS Supports It)

Some IONOS packages support Git deployment:

1. Log in to IONOS Control Panel
2. Check if **Git Deployment** is available
3. If yes, connect your GitHub repository directly
4. Set deployment branch to `main`

---

## 🔧 Method 3: VS Code Extension

Install the **SFTP** extension in VS Code:

1. Install extension: `Nomi.sftp` or `liximomo.sftp`
2. Create `.vscode/sftp.json`:

```json
{
    "name": "IONOS Server",
    "host": "ftp.yourdomain.com",
    "protocol": "ftp",
    "port": 21,
    "username": "your-ftp-username",
    "password": "your-ftp-password",
    "remotePath": "/",
    "uploadOnSave": false,
    "ignore": [
        ".vscode",
        ".git",
        ".DS_Store",
        "node_modules",
        "README.md",
        "config/telegram.php"
    ]
}
```

3. Right-click on folder → **SFTP: Upload Folder**

⚠️ **Security Note**: Don't commit `sftp.json` with passwords! Add it to `.gitignore`.

---

## 🔧 Method 4: Deploy Command Script

Create a PowerShell deployment script:

**`deploy.ps1`**:
```powershell
# Deploy to IONOS via FTP
Write-Host "🚀 Deploying to IONOS..." -ForegroundColor Green

# Install WinSCP if not installed
# Download from: https://winscp.net/

$FtpServer = "ftp.yourdomain.com"
$Username = "your-username"
$Password = "your-password"

# Use WinSCP .NET assembly
Add-Type -Path "C:\Program Files (x86)\WinSCP\WinSCPnet.dll"

$sessionOptions = New-Object WinSCP.SessionOptions -Property @{
    Protocol = [WinSCP.Protocol]::Ftp
    HostName = $FtpServer
    UserName = $Username
    Password = $Password
}

$session = New-Object WinSCP.Session

try {
    $session.Open($sessionOptions)
    
    $transferOptions = New-Object WinSCP.TransferOptions
    $transferOptions.TransferMode = [WinSCP.TransferMode]::Binary
    
    $transferResult = $session.PutFiles(".\*", "/", $False, $transferOptions)
    
    $transferResult.Check()
    
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
}
finally {
    $session.Dispose()
}
```

Then run: `.\deploy.ps1`

---

## ✅ Recommended Workflow

**For best results, use GitHub Actions (Method 1):**

1. ✅ **Automatic** - Deploys on every push
2. ✅ **Secure** - Credentials stored as GitHub secrets
3. ✅ **Trackable** - See deployment history in Actions tab
4. ✅ **Rollback** - Can redeploy previous commits
5. ✅ **Free** - GitHub Actions free tier is generous

---

## 📝 Post-Deployment Checklist

After setting up automated deployment:

- [ ] Test deployment with a small change
- [ ] Verify files appear on IONOS server
- [ ] Check that `config/telegram.php` is excluded
- [ ] Ensure `.env` files are not uploaded
- [ ] Test website functionality on live server
- [ ] Set up custom domain (if not already done)
- [ ] Enable HTTPS/SSL in IONOS panel
- [ ] Update `config.js` URLs to production values

---

## 🆘 Troubleshooting

### **Clean Up Broken Deployment (files at root `/` instead of `/Imperium_Roma/`)**

If a previous deployment incorrectly placed files at the server root `/` instead of inside `/Imperium_Roma/`, you need to manually delete these files/folders from root `/` via your IONOS file manager or FTP client:

**Folders to delete from root `/`** (NOT from inside `/Imperium_Roma/`):
- `/about/`
- `/assets/`
- `/authenticity/`
- `/config/`
- `/contact/`
- `/domus/`
- `/login/`
- `/logs/`
- `/policies/`
- `/services/`

**Files to delete from root `/`**:
- `/DEPLOYMENT.md`
- `/Imperium.png`
- `/README.md`
- `/index.html`
- `/robots.txt`
- `/send-telegram.php`
- `/sitemap.xml`

> **Warning**: Do NOT delete the `/Imperium_Roma/` folder itself — that contains your working website!

### **Deployment fails with "Permission denied"**
- Check FTP credentials are correct
- Verify server directory path
- Check IONOS account has FTP access enabled

### **Files not updating**
- Check browser cache (Ctrl+Shift+R)
- Verify correct server directory
- Check file permissions on IONOS

### **GitHub Actions workflow not running**
- Go to **Settings** → **Actions** → **General**
- Enable **Allow all actions and reusable workflows**

### **SFTP vs FTP vs FTPS**
- The workflow uses **FTPS** (FTP over TLS) on port 21 by default
- If FTPS doesn't work, try changing `protocol: ftps` to `protocol: ftp` in `deploy.yml`
- If you need SFTP (port 22), you'll need to switch to a different GitHub Action like `wlixcc/SFTP-Deploy-Action`
- IONOS Web Hosting Plus typically supports FTP and FTPS on port 21

---

## 🔒 Security Best Practices

1. ✅ Never commit FTP credentials to the repository
2. ✅ Use GitHub Secrets for sensitive data
3. ✅ Exclude sensitive config files in deployment
4. ✅ Use FTPS (secure FTP) when available
5. ✅ Regularly rotate FTP passwords
6. ✅ Use `.gitignore` for local config files

---

## 📞 Need Help?

- **IONOS Support**: Check your IONOS control panel for FTP details
- **GitHub Actions Docs**: [https://docs.github.com/actions](https://docs.github.com/actions)
- **FTP Deploy Action**: [https://github.com/SamKirkland/FTP-Deploy-Action](https://github.com/SamKirkland/FTP-Deploy-Action)

---

**Happy Deploying! 🚀**

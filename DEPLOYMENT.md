# Vercel Deployment Guide - AR Architecture App

This guide will walk you through deploying your AR Architecture app to Vercel.

## 📋 Prerequisites

1. **Vercel Account** (Free)
   - Sign up at: https://vercel.com/signup
   - Options: GitHub, GitLab, Bitbucket, or Email

2. **Node.js installed** (Already have this ✅)

3. **GitHub repository** (Already created ✅)
   - https://github.com/AkelonThemes/ar-architecture-app

---

## 🚀 Deployment Methods

You have **two options** to deploy:

### **Option A: Deploy via Vercel Dashboard (Easiest)**

### **Option B: Deploy via Vercel CLI (More Control)**

---

## 📱 Option A: Vercel Dashboard (Recommended for First Time)

### Step 1: Sign Up/Login to Vercel
1. Go to https://vercel.com/signup
2. Click **"Continue with GitHub"**
3. Authorize Vercel to access your GitHub account

### Step 2: Import Your Repository
1. Click **"Add New Project"** or **"Import Project"**
2. Find your repository: `AkelonThemes/ar-architecture-app`
3. Click **"Import"**

### Step 3: Configure Project Settings

**Framework Preset:** Vite (should auto-detect)

**Build & Development Settings:**
```
Build Command:       npm run build
Output Directory:    dist
Install Command:     npm install
Development Command: npm run dev
```

**Root Directory:** `./` (leave as is)

**Environment Variables:**
- ❌ **None required** for this project
- (Camera permissions are handled by browser, not server)

### Step 4: Deploy
1. Click **"Deploy"**
2. Wait 1-2 minutes for build to complete
3. You'll get a URL like: `https://ar-architecture-app.vercel.app`

---

## 💻 Option B: Vercel CLI (Advanced)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```
Choose your login method (GitHub recommended)

### Step 3: Deploy from Project Directory
```bash
# First time deployment
vercel

# Follow the prompts:
# - Set up and deploy "~/Desktop/ar-architecture-app"? [Y/n] → Y
# - Which scope? → Select your account (AkelonThemes)
# - Link to existing project? [y/N] → N
# - What's your project's name? → ar-architecture-app
# - In which directory is your code located? → ./
# - Want to override the settings? [y/N] → N
```

### Step 4: Deploy to Production
```bash
# After first deployment, use:
vercel --prod
```

---

## 🔐 Credentials & Variables Required

### ✅ **NO ENVIRONMENT VARIABLES NEEDED**

Your app doesn't require any API keys or secret credentials because:
- OpenCV.js loads from CDN
- Three.js is bundled via npm
- Camera access is handled by browser APIs
- No backend/database connections

### 📝 **What Vercel Needs:**
- **GitHub Account Access** (for automatic deployments)
- **Build Command:** `npm run build` (already configured)
- **Output Directory:** `dist` (already configured)

---

## ⚙️ Important Configuration Files

### ✅ Already Created:

1. **`vercel.json`** - Deployment configuration
   - Sets up camera permissions headers
   - Configures CORS for OpenCV.js
   - Enables device orientation sensors

2. **`vite.config.js`** - Build configuration
   - Output directory: `dist`
   - Optimizes Three.js and excludes OpenCV.js

3. **`.gitignore`** - Excludes unnecessary files
   - node_modules
   - build files
   - local config

---

## 🎥 Camera Permission on Vercel

### **Important: HTTPS is Automatic on Vercel ✅**

Vercel automatically provides HTTPS, which is **required** for:
- Camera access on mobile devices
- Device orientation (IMU) sensors
- Geolocation APIs

**You don't need to configure SSL certificates!**

### Browser Permissions
When users visit your deployed app:
1. Browser will prompt: "Allow camera access?"
2. User clicks "Allow"
3. AR features activate

On iOS Safari, device orientation requires:
- User tap/interaction first
- Then permission prompt appears

---

## 🌐 Custom Domain (Optional)

### Add Your Own Domain:

1. Go to **Project Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `ar.yourdomain.com`)
4. Follow DNS configuration steps
5. Vercel auto-configures SSL certificate

**Free domains included:**
- `yourproject.vercel.app`
- `yourproject-git-branch.vercel.app`

---

## 🔄 Automatic Deployments

Once connected to GitHub:

✅ **Every `git push` to master** → Auto-deploys to production
✅ **Every pull request** → Creates preview deployment
✅ **Every branch** → Gets its own preview URL

### Disable Auto-Deploy (Optional):
Project Settings → Git → Uncheck "Production Branch"

---

## 📊 Post-Deployment Checklist

After deploying, test:

### ✅ Desktop (Chrome/Firefox/Safari)
- [ ] App loads without errors
- [ ] Camera access prompt appears
- [ ] Feature detection works
- [ ] Models load correctly
- [ ] Touch controls work

### ✅ Mobile (iOS Safari / Android Chrome)
- [ ] HTTPS URL (check padlock icon)
- [ ] Camera permission granted
- [ ] Device orientation works
- [ ] Touch gestures (pinch, rotate)
- [ ] Model placement accurate

### ✅ Performance
- [ ] FPS > 20 on mobile
- [ ] OpenCV.js loads (~8MB CDN)
- [ ] Model shadows render
- [ ] Debug view toggles

---

## 🐛 Troubleshooting

### Build Fails on Vercel

**Error:** "Cannot find module 'three'"
```bash
# Solution: Ensure dependencies are in package.json
npm install three --save
git add package.json package-lock.json
git commit -m "Fix dependencies"
git push
```

### Camera Not Working on Deployed Site

**Issue:** "Camera not available" or permission denied

**Solutions:**
1. Check URL uses HTTPS (Vercel does this automatically)
2. Clear browser cache and reload
3. Check browser console for errors
4. Ensure camera isn't being used by another app

### OpenCV.js Fails to Load

**Error:** "OpenCV.js failed to load"

**Solutions:**
1. Check internet connection (loads from CDN)
2. Verify CORS headers in `vercel.json`
3. Check browser console for CSP errors
4. Try different browser

### Models Not Appearing

**Issue:** Model loaded but not visible

**Solutions:**
1. Open debug view (🔍 button)
2. Check if features detected
3. Point camera at textured surface
4. Verify console for errors

---

## 📈 Monitoring & Analytics

### Vercel Dashboard Provides:
- **Deployment logs** - Build output and errors
- **Function logs** - Runtime errors (if any)
- **Analytics** - Page views, performance
- **Bandwidth** - Data usage

### Free Tier Limits:
- ✅ 100 GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Automatic SSL
- ✅ Preview deployments

---

## 🔧 Environment Variables (If Needed Later)

If you add features requiring secrets:

### In Vercel Dashboard:
1. Go to **Project Settings** → **Environment Variables**
2. Add variables:
   - **Key:** `API_KEY`
   - **Value:** `your-secret-key`
   - **Environment:** Production, Preview, Development

### Access in Code:
```javascript
const apiKey = import.meta.env.VITE_API_KEY;
```

**Note:** Must prefix with `VITE_` for Vite to expose them

---

## 🚀 Quick Deploy Commands

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View deployment logs
vercel logs

# Open project dashboard
vercel open
```

---

## 📞 Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Vite Docs:** https://vitejs.dev/guide/
- **Vercel Discord:** https://vercel.com/discord
- **GitHub Issues:** https://github.com/AkelonThemes/ar-architecture-app/issues

---

## ✅ Success!

Once deployed, your AR app will be live at:
- **Production:** `https://ar-architecture-app.vercel.app`
- **Custom Domain:** (if configured)

Share the link and let users experience AR architecture visualization! 🏗️✨

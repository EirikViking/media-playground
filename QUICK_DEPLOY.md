# Quick Deployment Guide

## Your app is ready! Here's what to do next:

### ✅ Already Done:
- Git repository initialized
- All code committed
- Build tested and verified
- Production-ready

---

## Step 1: Push to GitHub (2 minutes)

### Create the GitHub repository:

1. Visit: https://github.com/new

2. Fill in:
   - Repository name: `media-playground`
   - Description: `Beautiful web app for creating photo collages`
   - Visibility: **Public** ✓
   - **UNCHECK** "Initialize this repository with:"
     - [ ] README
     - [ ] .gitignore
     - [ ] license

3. Click **"Create repository"**

### Push your code:

After creating the repository, GitHub will show you commands. Run these in your terminal:

```bash
git remote add origin https://github.com/YOUR_USERNAME/media-playground.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

## Step 2: Deploy to Cloudflare Pages (3 minutes)

1. Visit: https://dash.cloudflare.com/

2. Go to: **Workers & Pages** → **Create application** → **Pages**

3. Click: **Connect to Git**

4. Authorize Cloudflare to access GitHub (if first time)

5. Select your repository: `media-playground`

6. Configure build:
   ```
   Framework preset: Vite
   Build command: npm run build
   Build output directory: dist
   ```

7. Click: **Save and Deploy**

8. Wait 2-3 minutes for build to complete

9. Your app will be live at: `https://media-playground-XXX.pages.dev`

---

## That's it! 🎉

Your app is now:
- ✅ Version controlled on GitHub
- ✅ Deployed to Cloudflare Pages
- ✅ Automatically rebuilds on every git push
- ✅ Accessible worldwide on a fast CDN

---

## Optional: Custom Domain

In Cloudflare Pages dashboard:
1. Go to your project
2. Click **Custom domains**
3. Add your domain
4. Update DNS as instructed

---

## Commands Summary

```bash
# Already done - just for reference
git init
git add .
git commit -m "Initial commit"

# YOU NEED TO RUN THESE:
git remote add origin https://github.com/YOUR_USERNAME/media-playground.git
git branch -M main
git push -u origin main
```

Then deploy via Cloudflare Pages web interface following Step 2 above.

# GitHub and Cloudflare Pages Setup Instructions

Your Media Playground app is ready to deploy! Follow these steps:

## Step 1: Create GitHub Repository

### Option A: Using GitHub Web Interface

1. Go to https://github.com/new
2. Repository name: `media-playground` (or any name you prefer)
3. Description: "A beautiful web app for creating collages from photos and videos"
4. Choose Public or Private
5. **Do NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

7. Copy the repository URL (it will look like: `https://github.com/YOUR_USERNAME/media-playground.git`)

8. Run these commands in your terminal:

```bash
git remote add origin https://github.com/YOUR_USERNAME/media-playground.git
git branch -M main
git push -u origin main
```

### Option B: Using GitHub CLI (if installed)

```bash
gh repo create media-playground --public --source=. --remote=origin --push
```

## Step 2: Deploy to Cloudflare Pages

### Automatic Deployment (Recommended)

1. Go to https://dash.cloudflare.com/
2. Navigate to "Workers & Pages"
3. Click "Create application"
4. Select "Pages" tab
5. Click "Connect to Git"
6. Authorize Cloudflare to access your GitHub account
7. Select your `media-playground` repository
8. Configure build settings:
   - **Framework preset**: None (or Vite)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave empty)
9. Click "Save and Deploy"

Your app will be live at: `https://media-playground-xxx.pages.dev` (Cloudflare assigns a unique subdomain)

### Manual Deployment Alternative

If you prefer manual deployment:

```bash
npm run build
npx wrangler pages deploy dist
```

## Step 3: Custom Domain (Optional)

1. In Cloudflare Pages dashboard, go to your project
2. Click "Custom domains"
3. Click "Set up a custom domain"
4. Enter your domain name
5. Follow DNS configuration instructions

## Verification

Once deployed, test these features:
- ✅ Home page loads correctly
- ✅ Theme toggle works (light/dark mode)
- ✅ Navigate to Studio page
- ✅ Drag and drop images/videos
- ✅ Click items to view details
- ✅ Generate collage works
- ✅ Download collage works
- ✅ Refresh page preserves data

## Your Repository Is Ready

Current status:
- ✅ Git repository initialized
- ✅ Initial commit created
- ✅ All files staged and committed
- ✅ Ready to push to GitHub

Next: Follow Step 1 above to create your GitHub repository and push the code!

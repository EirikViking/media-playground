# Deployment Guide

## Cloudflare Pages Deployment

This app is optimized for Cloudflare Pages deployment.

### Quick Deploy

1. Push your code to GitHub

2. Go to [Cloudflare Pages Dashboard](https://dash.cloudflare.com/)

3. Click "Create a project"

4. Connect your GitHub repository

5. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (or leave empty)

6. Click "Save and Deploy"

Your app will be live in minutes!

### Environment Variables

No environment variables are required. This app runs entirely in the browser.

### Custom Domain (Optional)

1. Go to your project in Cloudflare Pages
2. Navigate to "Custom domains"
3. Add your domain and follow DNS configuration instructions

## Alternative Deployment Platforms

### Vercel

```bash
npm install -g vercel
vercel
```

Build settings:
- Build Command: `npm run build`
- Output Directory: `dist`

### Netlify

Build settings:
- Build command: `npm run build`
- Publish directory: `dist`

The `_redirects` file in the `public` folder ensures proper client-side routing.

### GitHub Pages

1. Update `vite.config.ts` to set the correct base path:

```typescript
export default defineConfig({
  plugins: [react()],
  base: '/your-repo-name/',
})
```

2. Build and deploy:

```bash
npm run build
```

Then use GitHub Actions or push the `dist` folder to the `gh-pages` branch.

## Performance Notes

- The app is highly optimized with code splitting
- Total bundle size is under 200KB (gzipped ~60KB)
- All assets are cached for offline use after first load
- No external API calls means instant load times

## Testing Before Deployment

```bash
npm run build
npm run preview
```

Visit `http://localhost:4173` to test the production build locally.

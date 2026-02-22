---
description: deploy to Cloudflare Pages production
---

Deploy the current working changes to Cloudflare production.
This project uses GitHub → Cloudflare Pages CI: pushing to `main` triggers an automatic build and deploy.

Always run these steps after making any code changes, unless the user explicitly says not to deploy.

// turbo-all

1. Stage all changes:
```powershell
git add -A
```

2. Commit with a descriptive message summarising the changes made this session:
```powershell
git commit -m "feat: <short description of changes>"
```
If there is nothing to commit (clean working tree), skip to step 4.

3. Push to origin main:
```powershell
git push origin main
```

4. Confirm to the user that the push succeeded and that Cloudflare Pages will auto-build from the `main` branch. Remind them they can monitor the build at https://dash.cloudflare.com/ → Workers & Pages → media-playground.

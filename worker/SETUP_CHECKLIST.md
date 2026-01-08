# Setup and Deployment Checklist

This file provides a complete checklist for setting up the Media Playground backend.
After completing each step, check it off.

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] Wrangler CLI available (`npx wrangler --version`)
- [ ] Logged into Cloudflare (`npx wrangler login`)

## Step 1: Install Worker Dependencies

```powershell
cd worker
npm install
```

- [ ] Dependencies installed successfully

## Step 2: Create D1 Database

```powershell
npx wrangler d1 create media-playground-db
```

**Expected output:**
```
✅ Successfully created DB 'media-playground-db' in region WEUR
Created your new D1 database.

[[d1_databases]]
binding = "DB"
database_name = "media-playground-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

- [ ] Database created
- [ ] Copied database_id: `____________________________________`

## Step 3: Update wrangler.toml

Open `worker/wrangler.toml` and replace `PLACEHOLDER_REPLACE_AFTER_CREATE` with your database_id:

```toml
[[d1_databases]]
binding = "DB"
database_name = "media-playground-db"
database_id = "YOUR_DATABASE_ID_HERE"
```

- [ ] wrangler.toml updated with database_id

## Step 4: Run Database Migration (Remote)

```powershell
npx wrangler d1 execute media-playground-db --remote --file=./schema.sql
```

**Expected output:**
```
🌀 Executing on remote database media-playground-db:
🌀 To execute on your local development database, remove the --remote flag
✅ Successfully created table 'projects'
```

- [ ] Migration completed successfully

## Step 5: Deploy Worker

```powershell
npm run deploy
```

**Expected output:**
```
⛅️ wrangler 4.x.x
Total Upload: XX.XX KiB / gzip: X.XX KiB
Uploaded media-playground-api
Published media-playground-api
  https://media-playground-api.YOUR_SUBDOMAIN.workers.dev
```

- [ ] Worker deployed
- [ ] Worker URL: `https://media-playground-api._____________.workers.dev`

## Step 6: Verify Worker is Live

```powershell
curl https://media-playground-api.YOUR_SUBDOMAIN.workers.dev/api/health
```

**Expected output:**
```json
{"status":"ok","timestamp":"2026-01-08T..."}
```

- [ ] Health check passed

## Step 7: Test API Endpoints

### Create a test project:
```powershell
curl -X POST https://media-playground-api.YOUR_SUBDOMAIN.workers.dev/api/projects -H "Content-Type: application/json" -d "{\"title\":\"Test Project\",\"data\":\"{\\\"version\\\":1}\"}"
```

- [ ] Returns `{"id":"..."}` 

### List projects:
```powershell
curl https://media-playground-api.YOUR_SUBDOMAIN.workers.dev/api/projects
```

- [ ] Returns array of projects

## Step 8: Configure Production API URL (Optional)

If your Worker is on a different domain than your Pages site, update the frontend:

**Option A**: Use relative path (if using Workers Routes)
No changes needed - frontend defaults to relative `/api` in production.

**Option B**: Hardcode Worker URL
Edit `src/utils/api.ts` and update the production URL.

- [ ] Production API routing configured

## Setup Complete!

Your Media Playground backend is now live. The frontend will automatically use:
- `http://localhost:8787` in development
- Your configured production URL in production

## Troubleshooting

### "Database not found"
Run `npx wrangler d1 list` to verify the database exists.

### "Table does not exist"
Run the migration: `npx wrangler d1 execute media-playground-db --remote --file=./schema.sql`

### CORS errors
Ensure you're testing from an allowed origin (localhost:5173, *.pages.dev, *.workers.dev).

### Worker not updating
Remember: Workers do NOT auto-deploy. Run `npm run deploy` after changes.

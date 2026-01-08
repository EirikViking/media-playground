# Media Playground API Worker

A Cloudflare Worker providing a JSON API for project metadata persistence and R2 image storage.

## Prerequisites

- Node.js 18+
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account with Workers, D1, and R2 access

## Setup

### 1. Install dependencies

```powershell
cd worker
npm install
```

### 2. Create D1 Database (if not exists)

```powershell
npx wrangler d1 create media-playground-db
```

Copy the database_id to `wrangler.toml`.

### 3. Create R2 Bucket

```powershell
npx wrangler r2 bucket create media-playground-assets
```

### 4. Run Database Migration

For local development:
```powershell
npm run db:migrate:local
```

For production:
```powershell
npm run db:migrate:remote
```

## Local Development

Start the Worker dev server (with local D1 and R2):
```powershell
npm run dev
```

The API will be available at `http://localhost:8787`

Local R2 data is stored in `.wrangler/state/r2/`

## Deployment

Deploy the Worker to Cloudflare:
```powershell
npm run deploy
```

**Important**: The Worker does NOT auto-deploy. Run this command after every change.

## API Endpoints

### Project Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/projects | Create a new project |
| GET | /api/projects | List all projects |
| GET | /api/projects/:id | Get a specific project |
| PUT | /api/projects/:id | Update a project |
| DELETE | /api/projects/:id | Delete a project (including R2 assets) |
| GET | /api/health | Health check |

### Asset Endpoints (Phase 3A)

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | /api/upload/:projectId/:assetId/:kind | Upload image to R2 |
| POST | /api/projects/:id/assets/commit | Commit asset metadata to project |
| GET | /api/assets/:kind/:projectId/:assetId | Stream image from R2 |
| DELETE | /api/projects/:id/assets/:assetId | Delete asset from R2 and project |

Where `:kind` is either `original` or `thumb`.

## Upload Limits

- **Max file size**: 10 MB
- **Max assets per project**: 30
- **Allowed MIME types**: image/jpeg, image/png, image/webp, image/gif

## Example Requests

### Upload an Image
```powershell
$file = [System.IO.File]::ReadAllBytes("photo.jpg")
Invoke-RestMethod -Uri "http://localhost:8787/api/upload/PROJECT_ID/ASSET_ID/original" `
  -Method PUT `
  -ContentType "image/jpeg" `
  -Body $file
```

### Commit Asset Metadata
```powershell
Invoke-RestMethod -Uri "http://localhost:8787/api/projects/PROJECT_ID/assets/commit" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"assetId":"ASSET_ID","originalKey":"...","thumbKey":"...","contentType":"image/jpeg","byteSize":12345,"width":1920,"height":1080,"fileName":"photo.jpg","createdAt":"2026-01-08T12:00:00Z"}'
```

### Get Asset (Thumbnail)
```powershell
Invoke-RestMethod -Uri "http://localhost:8787/api/assets/thumb/PROJECT_ID/ASSET_ID" -OutFile thumb.webp
```

### Delete Asset
```powershell
Invoke-RestMethod -Uri "http://localhost:8787/api/projects/PROJECT_ID/assets/ASSET_ID" -Method DELETE
```

## Verification

After deployment, verify all features:

1. **Health check**: `curl https://media-playground-api.cromkake.workers.dev/api/health`
2. **R2 available**: Response should include `"features":{"d1":true,"r2":true}`
3. **Upload test**: Use the frontend to upload an image
4. **Share test**: Copy share link, open in incognito, verify images load

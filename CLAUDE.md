# Media Playground - Development Guidelines

## Architecture

### Frontend
- **Platform**: Cloudflare Pages
- **Deployment**: Auto-deploys from GitHub on push to `main`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Backend  
- **Platform**: Cloudflare Worker (`media-playground-api`)
- **Database**: Cloudflare D1 (`media-playground-db`)
- **Storage**: Cloudflare R2 (`media-playground-assets`)
- **Deployment**: MANUAL ONLY - Never auto-deploys
- **Command**: `cd worker && npm run deploy`

## Critical Rules

### Worker Deployment
**The Worker does NOT auto-deploy.** After any changes to files under `worker/`:

1. You MUST explicitly tell the user to deploy
2. Provide the exact command: `cd worker && npm run deploy`
3. Explain how to verify: `curl https://media-playground-api.cromkake.workers.dev/api/health`

### Database Changes
After schema changes:
1. Local: `cd worker && npm run db:migrate:local`
2. Remote: `cd worker && npm run db:migrate:remote`

### R2 Bucket
The R2 bucket must be created manually before the Worker can use it:
1. Create bucket: `npx wrangler r2 bucket create media-playground-assets`
2. Binding is configured in `wrangler.toml` as `BUCKET`

### API Base URL
- Development: `http://localhost:8787`
- Production: `https://media-playground-api.cromkake.workers.dev`

## File Structure

```
media-playground/
├── src/                    # Frontend React app
│   ├── components/
│   │   ├── ProjectsPanel.tsx   # Projects save/load UI
│   │   ├── ShareButton.tsx     # Share project link
│   │   └── UploadProgressPanel.tsx  # Upload progress
│   ├── utils/
│   │   ├── api.ts              # API client
│   │   └── upload.ts           # R2 upload utilities
│   └── pages/
│       └── Studio.tsx          # Main workspace
├── worker/                 # Cloudflare Worker (MANUAL DEPLOY)
│   ├── src/
│   │   └── index.ts            # API implementation
│   ├── schema.sql              # D1 schema
│   └── wrangler.toml           # Worker config (D1 + R2)
└── public/
    └── _routes.json            # Pages routing config
```

## Local Development

### Frontend
```powershell
npm run dev
```
Runs at http://localhost:5173

### Worker (with local D1 and R2)
```powershell
cd worker
npm install
npm run db:migrate:local
npm run dev
```
Runs at http://localhost:8787

Note: Local R2 is simulated by Wrangler using `.wrangler/state/r2/`

## API Endpoints

### Project Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check |
| POST | /api/projects | Create project |
| GET | /api/projects | List projects |
| GET | /api/projects/:id | Get project |
| PUT | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Delete project + R2 cleanup |

### Asset Endpoints (Phase 3A)
| Method | Path | Description |
|--------|------|-------------|
| PUT | /api/upload/:projectId/:assetId/:kind | Upload original or thumb |
| POST | /api/projects/:id/assets/commit | Commit asset metadata |
| GET | /api/assets/:kind/:projectId/:assetId | Stream from R2 |
| DELETE | /api/projects/:id/assets/:assetId | Delete asset |

## Upload Limits
- Max file size: 10 MB
- Max assets per project: 30
- Allowed types: jpg, jpeg, png, webp, gif

## Sharing
Projects can be shared via URL: `/studio?project={projectId}`
The project ID in the URL auto-loads the project with all cloud assets.

## Environment Variables

### Worker (production)
None required. D1 and R2 bindings are configured in wrangler.toml.

### Frontend
- `VITE_API_BASE`: Override API base URL (optional)

## Automated Verification

### Local Verification
Run the full E2E test suite locally:
```powershell
npm run verify:e2e
```

This will:
1. Install worker dependencies
2. Run D1 migrations
3. Start worker dev server (port 8787)
4. Start frontend dev server (port 5173)
5. Run worker API tests
6. Run Playwright UI tests
7. Clean up all processes

### Individual Test Suites

**Worker API only:**
```powershell
# With local worker running
npm run verify:worker
```

**Playwright UI only:**
```powershell
# With both servers running
npm run verify:ui
```

### Production Verification (Optional)
To verify against production:
```powershell
$env:VERIFY_API_BASE="https://media-playground-api.cromkake.workers.dev"
$env:VERIFY_WEB_BASE="https://media-playground.pages.dev"
npm run verify:worker
```

### CI Behavior
On every push and PR to `main`:
- GitHub Actions runs `node scripts/verify-ci.mjs`
- Uses local Wrangler dev for Worker (no Cloudflare secrets needed)
- Uses local Vite dev for frontend
- Uploads Playwright report on failure

### Test Files
- `scripts/verify-worker.mjs` - Worker API verification
- `scripts/verify-ci.mjs` - CI orchestration
- `tests/playwright/share.spec.ts` - UI tests
- `playwright.config.ts` - Playwright configuration

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
- **Deployment**: MANUAL ONLY - Never auto-deploys
- **Command**: `cd worker && npm run deploy`

## Critical Rules

### Worker Deployment
**The Worker does NOT auto-deploy.** After any changes to files under `worker/`:

1. You MUST explicitly tell the user to deploy
2. Provide the exact command: `cd worker && npm run deploy`
3. Explain how to verify: `curl https://media-playground-api.<subdomain>.workers.dev/api/health`

### Database Changes
After schema changes:
1. Local: `cd worker && npm run db:migrate:local`
2. Remote: `cd worker && npm run db:migrate:remote`

### API Base URL
- Development: `http://localhost:8787`
- Production: Configure via environment or use Worker URL directly

## File Structure

```
media-playground/
├── src/                    # Frontend React app
│   ├── components/
│   │   └── ProjectsPanel.tsx   # Projects save/load UI
│   ├── utils/
│   │   └── api.ts              # API client
│   └── pages/
│       └── Studio.tsx          # Main workspace
├── worker/                 # Cloudflare Worker (MANUAL DEPLOY)
│   ├── src/
│   │   └── index.ts            # API implementation
│   ├── schema.sql              # D1 schema
│   └── wrangler.toml           # Worker config
└── public/
    └── _routes.json            # Pages routing config
```

## Local Development

### Frontend
```bash
npm run dev
```
Runs at http://localhost:5173

### Worker
```bash
cd worker
npm install
npm run db:migrate:local
npm run dev
```
Runs at http://localhost:8787

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check |
| POST | /api/projects | Create project |
| GET | /api/projects | List projects |
| GET | /api/projects/:id | Get project |
| PUT | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Delete project |

## Environment Variables

### Worker (production)
None required for basic operation. D1 binding is configured in wrangler.toml.

### Frontend
- `VITE_API_BASE`: Override API base URL (optional)

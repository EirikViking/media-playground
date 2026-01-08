# Media Playground API Worker

A Cloudflare Worker providing a JSON API for project metadata persistence.

## Prerequisites

- Node.js 18+
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account with Workers and D1 access

## Setup

### 1. Install dependencies

```bash
cd worker
npm install
```

### 2. Create D1 Database

```bash
npm run db:create
```

This will output a database ID. Copy it and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "media-playground-db"
database_id = "YOUR_DATABASE_ID_HERE"
```

### 3. Run Database Migration

For local development:
```bash
npm run db:migrate:local
```

For production:
```bash
npm run db:migrate:remote
```

## Local Development

Start the Worker dev server:
```bash
npm run dev
```

The API will be available at `http://localhost:8787`

## Deployment

Deploy the Worker to Cloudflare:
```bash
npm run deploy
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/projects | Create a new project |
| GET | /api/projects | List all projects |
| GET | /api/projects/:id | Get a specific project |
| PUT | /api/projects/:id | Update a project |
| DELETE | /api/projects/:id | Delete a project |
| GET | /api/health | Health check |

## Example Requests

### Create Project
```bash
curl -X POST http://localhost:8787/api/projects \
  -H "Content-Type: application/json" \
  -d '{"title": "My Project", "data": "{\"version\":1,\"mediaItems\":[]}"}'
```

### List Projects
```bash
curl http://localhost:8787/api/projects
```

### Get Project
```bash
curl http://localhost:8787/api/projects/YOUR_PROJECT_ID
```

### Update Project
```bash
curl -X PUT http://localhost:8787/api/projects/YOUR_PROJECT_ID \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title", "data": "{\"version\":1,\"mediaItems\":[]}"}'
```

### Delete Project
```bash
curl -X DELETE http://localhost:8787/api/projects/YOUR_PROJECT_ID
```

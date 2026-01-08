# Kurt Edgar's Gallery (Media Playground)

A beautiful, modern web app for creating collages from your photos and videos. Now with cloud-based project persistence!

## Features

- **Drag & Drop**: Simple drag-and-drop interface for adding media
- **Privacy First**: All files stay local in your browser
- **Creative Tools**: Generate beautiful collages from your images
- **Rich Metadata**: Add titles, tags, and notes to your media
- **Dark Mode**: Built-in light and dark theme support
- **Cloud Sync**: Save project metadata to Cloudflare D1 database
- **Offline Support**: Falls back to LocalStorage if backend is unavailable
- **Responsive Design**: Works great on desktop and tablet

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Pages                         │
│                   (Frontend - Auto Deploy)                  │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   React     │  │  Tailwind   │  │  Framer Motion      │ │
│  │   + Vite    │  │  CSS        │  │  Animations         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ /api/*
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Cloudflare Worker                         │
│                (Backend - Manual Deploy)                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  media-playground-api                                │   │
│  │  POST/GET/PUT/DELETE /api/projects                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Cloudflare D1 (SQLite)                              │   │
│  │  media-playground-db                                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

### Frontend
- **Vite** - Fast build tool and dev server
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animations
- **React Router** - Client-side routing

### Backend
- **Cloudflare Workers** - Serverless API
- **Cloudflare D1** - SQLite database
- **Wrangler** - CLI for deployment

## Quick Start

### Frontend Only (No Backend)

```powershell
npm install
npm run dev
```

The app works without the backend using LocalStorage fallback.

### Full Stack (With Backend)

```powershell
# Terminal 1: Frontend
npm install
npm run dev

# Terminal 2: Backend
cd worker
npm install
npm run db:migrate:local
npm run dev
```

## Backend Setup (First Time)

See `worker/SETUP_CHECKLIST.md` for step-by-step instructions, or run:

```powershell
cd worker
.\setup.ps1
```

The setup script will:
1. Install dependencies
2. Authenticate with Cloudflare
3. Create D1 database
4. Update configuration
5. Run migrations

After setup, deploy with:

```powershell
npm run deploy
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/projects` | Create project |
| GET | `/api/projects` | List all projects |
| GET | `/api/projects/:id` | Get project by ID |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |

## Project Structure

```
media-playground/
├── src/                    # Frontend source
│   ├── components/         # React components
│   ├── hooks/              # Custom hooks
│   ├── pages/              # Route pages
│   ├── types.ts            # TypeScript types
│   └── utils/              # Utilities & API client
├── worker/                 # Cloudflare Worker
│   ├── src/index.ts        # API implementation
│   ├── schema.sql          # D1 schema
│   ├── wrangler.toml       # Worker config
│   ├── setup.ps1           # Setup script
│   └── verify.ps1          # Verification script
├── public/                 # Static assets
└── CLAUDE.md               # Development guidelines
```

## Deployment

### Frontend (Automatic)

Pushing to `main` triggers automatic deployment to Cloudflare Pages.

### Backend (Manual)

```powershell
cd worker
npm run deploy
```

⚠️ **Worker does NOT auto-deploy.** You must run `npm run deploy` manually after changes.

## Verification

Test the deployed API:

```powershell
cd worker
.\verify.ps1 -WorkerUrl "https://media-playground-api.YOUR_SUBDOMAIN.workers.dev"
```

## Browser Compatibility

Works in all modern browsers that support:
- ES2020
- File API
- Canvas API
- LocalStorage/IndexedDB

## License

MIT

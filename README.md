# Media Playground

A beautiful, modern web app for creating collages from your photos and videos. Everything runs entirely in the browser with no uploads or backend required.

## Features

- **Drag & Drop**: Simple drag-and-drop interface for adding media
- **Privacy First**: All files stay local in your browser
- **Creative Tools**: Generate beautiful collages from your images
- **Rich Metadata**: Add titles, tags, and notes to your media
- **Dark Mode**: Built-in light and dark theme support
- **Persistent Storage**: Projects are saved automatically using LocalStorage
- **Responsive Design**: Works great on desktop and tablet

## Tech Stack

- **Vite** - Fast build tool and dev server
- **React** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Deployment

This app is ready to deploy on Cloudflare Pages:

1. **Build Command**: `npm run build`
2. **Output Directory**: `dist`

The app is a static SPA with no backend dependencies and will work perfectly on any static hosting platform.

## Usage

1. Navigate to the Studio page
2. Drag and drop images or videos, or click to browse files
3. Click on any media item to view details and add metadata
4. Use the "Create Something Fun" section to generate a collage
5. Download your creation as a PNG

All your work is automatically saved in your browser and will persist across sessions.

## Browser Compatibility

Works in all modern browsers that support:
- ES2020
- File API
- Canvas API
- LocalStorage

## License

MIT

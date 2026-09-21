# SOLANDER — Frontend Web Application

The client-side interface for **SOLANDER**, built with **React 19**, **Vite 8**, and **Vanilla CSS Design System**.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

## Environment Configuration

Create a `.env` file in this directory based on `.env.example`:

```env
# Backend REST API endpoint
VITE_API_URL=http://localhost:5000/api/v1

# Firebase Client Authentication
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Key Libraries

- **React 19** & **Vite 8**
- **React Router DOM 7** — Client-side SPA navigation & route guards
- **Axios** — Centralized API requests with Bearer token authentication
- **Firebase Auth v12** — Secure email and password authentication
- **Lucide React** — Minimalist vector iconography

## Production Deployment

- **Vercel**: Pre-configured via `vercel.json` for client-side routing.
- **Netlify / Static Hosts**: Pre-configured via `public/_redirects`.
- Build output directory: `dist`.

For full-stack documentation and backend details, see the [Root README](../README.md).

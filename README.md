# EcoShield

A Vite + React + TypeScript + Tailwind app (single-screen dashboard prototype).

## Local
```bash
npm install
npm run dev      # http://localhost:5173
npm run build && npm start   # production build served on $PORT (default 3000)
```

## Deploy on Railway
1. Push this repo to GitHub.
2. Railway → New → Deploy from GitHub repo → select it.
3. Railway builds with `npm run build` and starts with `npx serve -s dist -l $PORT` (see `railway.json`).
4. Service → Settings → Networking → Generate Domain for a public URL.

The app listens on Railway's injected `$PORT`.

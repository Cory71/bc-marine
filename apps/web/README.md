# BC Marine: Web App

Vite + React single-page app for BC Marine, deployed on Vercel. It shares its data layer with the mobile app through [`@bc-marine/shared`](../../packages/shared).

## Quick start

From the repo root:

```bash
npm install
npm run dev --workspace bc-marine-web      # http://localhost:5173
npm test --workspace bc-marine-web         # Vitest + Testing Library
npm run build --workspace bc-marine-web    # production build in dist/
npm run preview --workspace bc-marine-web  # serve the build at http://localhost:4173
```

## Layout

- `src/context/`: app state (active station from `?station=`, saved stations in `localStorage`, data loading)
- `src/layout/`: sidebar (drawer below 1024px), header and page frame
- `src/pages/`: dashboard, tides, weather and currents views
- `src/components/`: cards, the SVG tide curve, weekly tide bars, loading and error states
- `api/ec-feed.js`: Vercel function that proxies Environment Canada feeds (see [architecture notes](../../docs/architecture.md#the-environment-canada-proxy))
- `server/ecFeedHandler.js`: the proxy logic, shared by the Vercel function and the local dev/preview servers

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { handleEcFeedRequest } from './server/ecFeedHandler.js';
import { handleBuoyFeedRequest } from './server/buoyFeedHandler.js';

// The /api relays, each as [path, query parameter, handler] — the same handlers the Vercel functions use
const API_ROUTES = [
  ['/api/ec-feed', 'code', handleEcFeedRequest],
  ['/api/buoy-feed', 'id', handleBuoyFeedRequest],
];

// Serve the /api relays during `npm run dev` and `npm run preview`
function apiDevProxy() {
  function mountRoutes(server) {
    for (const [path, param, handler] of API_ROUTES) {
      server.middlewares.use(path, async (req, res) => {
        // req.url is relative to the mount path, e.g. '/?code=06400'
        const value = new URL(req.url, 'http://localhost').searchParams.get(param);
        const { status, headers, body } = await handler(value);
        res.writeHead(status, headers);
        res.end(body);
      });
    }
  }

  return {
    name: 'api-dev-proxy',
    configureServer: mountRoutes,
    configurePreviewServer: mountRoutes,
  };
}

export default defineConfig({
  plugins: [react(), apiDevProxy()],
  test: {
    environment: 'jsdom',
  },
});

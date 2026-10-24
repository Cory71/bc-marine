import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { handleEcFeedRequest } from './server/ecFeedHandler.js';

// Serve /api/ec-feed during `npm run dev` and `npm run preview`,
// using the same handler as the Vercel function
function ecFeedDevProxy() {
  async function handleRequest(req, res) {
    // req.url is relative to the mount path, e.g. '/?code=06400'
    const code = new URL(req.url, 'http://localhost').searchParams.get('code');
    const { status, headers, body } = await handleEcFeedRequest(code);
    res.writeHead(status, headers);
    res.end(body);
  }

  return {
    name: 'ec-feed-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/ec-feed', handleRequest);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/ec-feed', handleRequest);
    },
  };
}

export default defineConfig({
  plugins: [react(), ecFeedDevProxy()],
  test: {
    environment: 'jsdom',
  },
});

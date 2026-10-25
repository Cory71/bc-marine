import { handleBuoyFeedRequest } from '../server/buoyFeedHandler.js';

// Vercel function: GET /api/buoy-feed?id=46146
export async function GET(request) {
  const id = new URL(request.url).searchParams.get('id');
  const { status, headers, body } = await handleBuoyFeedRequest(id);
  return new Response(body, { status, headers });
}

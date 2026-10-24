import { handleEcFeedRequest } from '../server/ecFeedHandler.js';

// Vercel function: GET /api/ec-feed?code=06400
export async function GET(request) {
  const code = new URL(request.url).searchParams.get('code');
  const { status, headers, body } = await handleEcFeedRequest(code);
  return new Response(body, { status, headers });
}

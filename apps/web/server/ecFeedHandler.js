import { isValidEcFeedCode, buildDirectEcFeedUrl } from '@bc-marine/shared';

// Let Vercel's CDN keep each feed for 30 minutes (same as the app's own cache)
const CACHE_CONTROL = 's-maxage=1800, stale-while-revalidate=600';

// Environment Canada sends no CORS headers, so browsers can't read its feeds.
// This fetches one feed server-side. Only codes from our own list are allowed,
// so it can't be used as an open proxy to fetch any URL.
export async function handleEcFeedRequest(code, fetchImpl = fetch) {
  if (!isValidEcFeedCode(code)) {
    return textResponse(400, 'Unknown feed code');
  }

  try {
    const upstream = await fetchImpl(buildDirectEcFeedUrl(code));
    if (!upstream.ok) return textResponse(502, 'Environment Canada feed unavailable');

    return {
      status: 200,
      headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': CACHE_CONTROL },
      body: await upstream.text(),
    };
  } catch {
    return textResponse(502, 'Environment Canada feed unavailable');
  }
}

// Build a plain-text error response
function textResponse(status, message) {
  return { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' }, body: message };
}

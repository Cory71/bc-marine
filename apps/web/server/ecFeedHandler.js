import { isValidEcFeedCode, buildDirectEcFeedUrl } from '@bc-marine/shared';

// Let Vercel's CDN keep each feed for 10 minutes, so a new forecast (issued around
// 4:00 AM, 10:30 AM, 4:00 PM and 9:30 PM) reaches everyone soon after release
const CACHE_CONTROL = 's-maxage=600, stale-while-revalidate=120';

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

    const xml = await upstream.text();
    // EC rewrites its files when a forecast is issued; a read mid-write can return
    // half a file. Never pass that on (or let the CDN cache it); the next request retries.
    if (!isCompleteFeed(xml)) return textResponse(502, 'Environment Canada feed incomplete');

    return {
      status: 200,
      headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': CACHE_CONTROL },
      body: xml,
    };
  } catch {
    return textResponse(502, 'Environment Canada feed unavailable');
  }
}

// A whole feed ends with its closing Atom or RSS tag
function isCompleteFeed(xml) {
  const ending = xml.trimEnd();
  return ending.endsWith('</feed>') || ending.endsWith('</rss>');
}

// Build a plain-text error response. Errors are never cached, so the next request tries again.
function textResponse(status, message) {
  return {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    body: message,
  };
}

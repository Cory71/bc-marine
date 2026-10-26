import { OBSERVATION_SITES, buildDirectBuoyFeedUrl } from '@bc-marine/shared';

// Let Vercel's CDN keep each buoy file for 10 minutes (buoys report hourly)
const CACHE_CONTROL = 's-maxage=600, stale-while-revalidate=120';

// Only the BC buoys in our own site list can be fetched
const ALLOWED_BUOY_IDS = new Set(
  OBSERVATION_SITES.filter(site => site.type === 'buoy').map(site => site.sourceId)
);

// NOAA sends no CORS headers, so browsers can't read its buoy files. This fetches
// one file server-side for an allowlisted buoy, so it can't be used as an open proxy.
export async function handleBuoyFeedRequest(id, fetchImpl = fetch) {
  if (!ALLOWED_BUOY_IDS.has(id)) return textResponse(400, 'Unknown buoy', 'no-store');

  try {
    const upstream = await fetchImpl(buildDirectBuoyFeedUrl(id));
    if (!upstream.ok) return textResponse(502, 'Buoy data unavailable', 'no-store');

    const text = await upstream.text();
    // Never pass on (or let the CDN cache) a half-written or empty file
    if (!isCompleteBuoyFile(text)) return textResponse(502, 'Buoy data incomplete', 'no-store');
    return textResponse(200, text, CACHE_CONTROL);
  } catch {
    return textResponse(502, 'Buoy data unavailable', 'no-store');
  }
}

// Complete = the two '#' header lines, then a data row with a value for every column
function isCompleteBuoyFile(text) {
  const lines = text.split('\n');
  const headers = lines.filter(line => line.startsWith('#'));
  const firstRow = lines.find(line => line.trim() && !line.startsWith('#'));
  if (headers.length < 2 || !firstRow) return false;

  const columnCount = headers[0].replace('#', '').trim().split(/\s+/).length;
  return firstRow.trim().split(/\s+/).length === columnCount;
}

function textResponse(status, body, cacheControl) {
  return {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': cacheControl },
    body,
  };
}

import { setCache, getCache } from './cache.js';
import { getText } from './http.js';
import { EC_FEED_CODES, EC_SUBAREA, buildDirectEcFeedUrl } from './ecFeeds.js';

// The XML parser is only loaded when a forecast is first parsed, so it stays
// out of the web app's first download (about 60 KB)
let xmlParserPromise = null;

function getXmlParser() {
  xmlParserPromise ??= import('fast-xml-parser').then(({ XMLParser }) => new XMLParser());
  return xmlParserPromise;
}

// Builds the feed URL from a code — the web app swaps this for its proxy
let currentBuildUrl = buildDirectEcFeedUrl;

// Choose how feed URLs are built (call once at app start-up)
export function configureEcFeedUrl(buildUrl) {
  currentBuildUrl = buildUrl;
}

// Fetch marine forecast and active warnings for a BC region name
export async function fetchMarineForecast(regionName) {
  const cacheKey = `ec_${regionName}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const code = EC_FEED_CODES[regionName];
  if (!code) return { warnings: [], forecast: 'No forecast available for this region.' };

  const xml = await getText(currentBuildUrl(code));
  const data = await parseMarineFeed(xml, regionName);
  setCache(cacheKey, data);
  return data;
}

// Turn an EC feed's XML into { warnings, forecast } for one region
export async function parseMarineFeed(xml, regionName) {
  const parser = await getXmlParser();
  const parsed = parser.parse(xml);

  // EC feeds can be Atom (feed.entry) or RSS 2.0 (rss.channel.item)
  const atomRaw = parsed?.feed?.entry;
  const rssRaw = parsed?.rss?.channel?.item;
  const raw = atomRaw ?? rssRaw ?? [];
  const allEntries = Array.isArray(raw) ? raw : [raw];

  // When the region shares a feed with other sub-areas, keep only entries
  // whose title mentions this region's sub-area
  const subArea = EC_SUBAREA[regionName];
  const entries = subArea
    ? allEntries.filter(e =>
        String(e.title ?? '')
          .toLowerCase()
          .includes(subArea)
      )
    : allEntries;

  const warnings = entries
    .filter(e => {
      const t = String(e.title ?? '').toLowerCase();
      return t.includes('warning') || t.includes('watch');
    })
    .map(e => ({ title: e.title, summary: getEntryText(e) }));

  // Use first entry that mentions forecast, or fall back to the first entry
  const forecastEntry =
    entries.find(e =>
      String(e.title ?? '')
        .toLowerCase()
        .includes('forecast')
    ) ?? entries[0];
  const forecast = forecastEntry ? getEntryText(forecastEntry) : 'No forecast available.';

  return { warnings, forecast };
}

// summary is used in Atom, description in RSS 2.0 — strip HTML tags and decode entities
function getEntryText(entry) {
  const raw = entry.summary ?? entry.description ?? '';
  return String(raw)
    .replace(/&#60;/g, '<')
    .replace(/&#62;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();
}

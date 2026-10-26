import { setCache, getCache } from './cache.js';
import { getText } from './http.js';
import { EC_FEED_CODES, EC_SUBAREA, buildDirectEcFeedUrl, ecCacheKey } from './ecFeeds.js';

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

// Fetch marine forecast and active warnings for a BC region name.
// subArea picks one part of a split area, e.g. 'east entrance' of Juan de Fuca Strait.
export async function fetchMarineForecast(regionName, subArea = EC_SUBAREA[regionName]) {
  const cacheKey = ecCacheKey(regionName, subArea);
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const code = EC_FEED_CODES[regionName];
  if (!code) return { warnings: [], forecast: 'No forecast available for this region.' };

  // Download the feed and the XML parser at the same time, not one after the other
  const [xml] = await Promise.all([getText(currentBuildUrl(code)), getXmlParser()]);
  const data = await parseMarineFeed(xml, regionName, subArea);
  setCache(cacheKey, data);
  return data;
}

// Turn an EC feed's XML into { warnings, forecast } for one region (or one part of it)
export async function parseMarineFeed(xml, regionName, subArea = EC_SUBAREA[regionName]) {
  const parser = await getXmlParser();
  const parsed = parser.parse(xml);

  // EC feeds can be Atom (feed.entry) or RSS 2.0 (rss.channel.item)
  const atomRaw = parsed?.feed?.entry;
  const rssRaw = parsed?.rss?.channel?.item;
  const raw = atomRaw ?? rssRaw ?? [];
  const allEntries = Array.isArray(raw) ? raw : [raw];

  // When the region shares a feed with other sub-areas, keep only entries
  // whose title mentions this region's sub-area
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

  return { warnings, forecast: pickForecastText(entries) };
}

// The forecast to show. A feed split into halves with no half chosen (offshore
// areas) shows each half's forecast, labelled; otherwise the first forecast entry.
function pickForecastText(entries) {
  const regularForecasts = entries.filter(e =>
    String(e.title ?? '')
      .toLowerCase()
      .startsWith('forecast for')
  );
  if (regularForecasts.length > 1) {
    return regularForecasts.map(e => `${partLabel(e.title)}: ${getEntryText(e)}`).join('\n\n');
  }

  // Use first entry that mentions forecast, or fall back to the first entry
  const forecastEntry =
    entries.find(e =>
      String(e.title ?? '')
        .toLowerCase()
        .includes('forecast')
    ) ?? entries[0];
  return forecastEntry ? getEntryText(forecastEntry) : 'No forecast available.';
}

// 'Forecast for Tonight. - Bowie - northern half' → 'Northern half'
function partLabel(title) {
  const part = String(title).split(' - ').pop().trim();
  return part.charAt(0).toUpperCase() + part.slice(1);
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

// EC hard-wraps its text mid-sentence. Join those lines, but keep "Issued ..." on its own line,
// and keep blank lines (they separate the halves of an offshore forecast).
export function tidyForecastText(text) {
  return text
    .split(/\n\s*\n/)
    .map(paragraph => paragraph.trim().replace(/\s*\n(?!Issued)\s*/g, ' '))
    .join('\n\n');
}

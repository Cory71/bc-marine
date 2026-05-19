import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { setCache, getCache } from './cache';

const parser = new XMLParser();

// BC marine region Atom feed URLs from Environment Canada (verified URLs)
const EC_FEEDS = {
  'Dixon Entrance': 'https://weather.gc.ca/rss/marine/03300_e.xml',
  'Hecate Strait': 'https://weather.gc.ca/rss/marine/06200_e.xml',
  'Queen Charlotte Sound': 'https://weather.gc.ca/rss/marine/12300_e.xml',
  'Milbanke Sound': 'https://weather.gc.ca/rss/marine/02300_e.xml',
  'Queen Charlotte Strait': 'https://weather.gc.ca/rss/marine/12400_e.xml',
  'Johnstone Strait': 'https://weather.gc.ca/rss/marine/06800_e.xml',
  'Georgia Strait North': 'https://weather.gc.ca/rss/marine/14300_e.xml',
  'Georgia Strait South': 'https://weather.gc.ca/rss/marine/14300_e.xml',
  'Howe Sound': 'https://weather.gc.ca/rss/marine/06400_e.xml',
  'Nootka Sound': 'https://weather.gc.ca/rss/marine/15300_e.xml',
  'Clayoquot Sound': 'https://weather.gc.ca/rss/marine/16200_e.xml',
  'Barkley Sound': 'https://weather.gc.ca/rss/marine/16200_e.xml',
  'Juan de Fuca Strait': 'https://weather.gc.ca/rss/marine/07000_e.xml',
  'Saanich Inlet': 'https://weather.gc.ca/rss/marine/07000_e.xml',
};

// Fetch marine forecast and active warnings for a BC region name
export async function fetchMarineForecast(regionName) {
  const cacheKey = `ec_${regionName}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const feedUrl = EC_FEEDS[regionName];
  if (!feedUrl) return { warnings: [], forecast: 'No forecast available for this region.' };

  const response = await axios.get(feedUrl);
  const parsed = parser.parse(response.data);

  // EC feeds can be Atom (feed.entry) or RSS 2.0 (rss.channel.item)
  const atomRaw = parsed?.feed?.entry;
  const rssRaw = parsed?.rss?.channel?.item;
  const raw = atomRaw ?? rssRaw ?? [];
  const entries = Array.isArray(raw) ? raw : [raw];

  // summary is used in Atom, description in RSS 2.0 — strip HTML tags and decode entities
  const getText = e => {
    const raw = e.summary ?? e.description ?? '';
    return String(raw)
      .replace(/&#60;/g, '<').replace(/&#62;/g, '>').replace(/&amp;/g, '&')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .trim();
  };

  const warnings = entries
    .filter(e => {
      const t = String(e.title ?? '').toLowerCase();
      return t.includes('warning') || t.includes('watch');
    })
    .map(e => ({ title: e.title, summary: getText(e) }));

  // Use first entry that mentions forecast, or fall back to the first entry
  const forecastEntry = entries.find(e => String(e.title ?? '').toLowerCase().includes('forecast')) ?? entries[0];
  const forecast = forecastEntry ? getText(forecastEntry) : 'No forecast available.';

  const data = { warnings, forecast };
  setCache(cacheKey, data);
  return data;
}

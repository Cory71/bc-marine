import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { setCache, getCache } from './cache';

const parser = new XMLParser();

// BC marine region RSS feed URLs from Environment Canada
const EC_FEEDS = {
  'Strait of Georgia': 'https://weather.gc.ca/rss/marine/14_e.xml',
  'Juan de Fuca Strait': 'https://weather.gc.ca/rss/marine/13_e.xml',
  'West Coast Vancouver Island': 'https://weather.gc.ca/rss/marine/15_e.xml',
  'Dixon Entrance': 'https://weather.gc.ca/rss/marine/24_e.xml',
  'Queen Charlotte Strait': 'https://weather.gc.ca/rss/marine/16_e.xml',
  'Milbanke Sound': 'https://weather.gc.ca/rss/marine/19_e.xml',
  'Hecate Strait': 'https://weather.gc.ca/rss/marine/23_e.xml',
  'Queen Charlotte Sound': 'https://weather.gc.ca/rss/marine/20_e.xml',
  'Johnstone Strait': 'https://weather.gc.ca/rss/marine/17_e.xml',
  'Georgia Strait North': 'https://weather.gc.ca/rss/marine/14_e.xml',
  'Georgia Strait South': 'https://weather.gc.ca/rss/marine/14_e.xml',
  'Howe Sound': 'https://weather.gc.ca/rss/marine/14_e.xml',
  'Saanich Inlet': 'https://weather.gc.ca/rss/marine/13_e.xml',
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
  const entries = parsed?.feed?.entry ?? [];

  // Pull out any warning or watch entries
  const warnings = entries
    .filter(e => e.title?.toLowerCase().includes('warning') || e.title?.toLowerCase().includes('watch'))
    .map(e => ({ title: e.title, summary: e.summary }));

  // Use the first forecast entry as the main forecast text
  const forecastEntry = entries.find(e => e.title?.toLowerCase().includes('forecast'));
  const forecast = forecastEntry?.summary ?? 'No forecast available.';

  const data = { warnings, forecast };
  setCache(cacheKey, data);
  return data;
}

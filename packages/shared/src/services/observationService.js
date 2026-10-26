import { getJson, getText } from './http.js';
import { getCache, setCache } from './cache.js';
import { distanceKm } from '../units.js';
import { OBSERVATION_SITES } from '../observationSites.js';
import { readLighthouseFeature, parseNdbcText } from '../observationReaders.js';

const NEARBY_RADIUS_KM = 100;
const SITES_TO_SHOW = 3;
// Lighthouses report every minute, so keep observations for 10 minutes, not 30
const OBSERVATIONS_TTL_MS = 10 * 60 * 1000;

// Direct NOAA URL (works on mobile; browsers need the web app's relay)
export function buildDirectBuoyFeedUrl(wmoId) {
  return `https://www.ndbc.noaa.gov/data/realtime2/${wmoId}.txt`;
}

// Builds buoy URLs — the web app swaps this for its relay at start-up
let currentBuildBuoyUrl = buildDirectBuoyFeedUrl;

export function configureBuoyFeedUrl(buildUrl) {
  currentBuildBuoyUrl = buildUrl;
}

// The 3 nearest sites within 100 km, nearest first. If none of those is a buoy
// but one is within 100 km, it replaces the third, so waves show when they can.
export function selectNearbySites(station, sites = OBSERVATION_SITES) {
  const nearby = sites
    .map(site => ({ site, distanceKm: distanceKm(station.lat, station.lon, site.lat, site.lon) }))
    .filter(entry => entry.distanceKm <= NEARBY_RADIUS_KM)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const chosen = nearby.slice(0, SITES_TO_SHOW);
  const hasBuoy = chosen.some(entry => entry.site.type === 'buoy');
  const nearestBuoy = nearby.find(entry => entry.site.type === 'buoy');
  if (!hasBuoy && nearestBuoy && chosen.length === SITES_TO_SHOW) {
    chosen[SITES_TO_SHOW - 1] = nearestBuoy;
  }
  return chosen;
}

// Latest readings for the sites near a station: [{ site, distanceKm, reading }].
// A site that fails or has nothing recent gets reading: null; the others still show.
export async function fetchNearbyObservations(station, sites = OBSERVATION_SITES) {
  const cacheKey = `observations_${station.lat}_${station.lon}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const chosen = selectNearbySites(station, sites);
  const results = await Promise.allSettled(chosen.map(entry => fetchSiteReading(entry.site)));
  const observations = chosen.map((entry, i) => ({
    ...entry,
    reading: results[i].status === 'fulfilled' ? results[i].value : null,
  }));

  // Only cache a complete set: after a brief network blip, the next load tries again
  const anyFailed = results.some(result => result.status === 'rejected');
  if (!anyFailed) setCache(cacheKey, observations, OBSERVATIONS_TTL_MS);
  return observations;
}

function fetchSiteReading(site) {
  return site.type === 'buoy' ? fetchBuoyReading(site) : fetchLighthouseReading(site);
}

async function fetchLighthouseReading(site) {
  const url = 'https://api.weather.gc.ca/collections/swob-realtime/items';
  const params = { f: 'json', 'msc_id-value': site.sourceId, sortby: '-obs_date_tm', limit: 1 };
  const data = await getJson(url, { params });
  return readLighthouseFeature(data.features?.[0]?.properties);
}

async function fetchBuoyReading(site) {
  return parseNdbcText(await getText(currentBuildBuoyUrl(site.sourceId)));
}

import { getJson, getText } from './http.js';
import { getCache, setCache } from './cache.js';
import { distanceKm } from '../units.js';
import { OBSERVATION_SITES } from '../observationSites.js';
import { readLighthouseFeature, parseNdbcText, parseNdbcRows } from '../observationReaders.js';

const NEARBY_RADIUS_KM = 100;
// Offshore areas are far from every site, so they look further out
const OFFSHORE_RADIUS_KM = 300;
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

// The 3 nearest sites within 100 km (300 km offshore) that report for the station's coast group,
// nearest first. Sites from another group are skipped even when closer (straight-line
// distance can cut across Vancouver Island), so a station may get fewer than 3.
// If none of the 3 is a buoy but one qualifies, it replaces the third, so waves show when they can.
export function selectNearbySites(station, sites = OBSERVATION_SITES) {
  const radiusKm = station.offshore ? OFFSHORE_RADIUS_KM : NEARBY_RADIUS_KM;
  const nearby = sites
    .filter(site => site.coasts.includes(station.coast))
    .map(site => ({ site, distanceKm: distanceKm(station.lat, station.lon, site.lat, site.lon) }))
    .filter(entry => entry.distanceKm <= radiusKm)
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

const HISTORY_HOURS = 12;

// Find a lighthouse or buoy by its id (the slug used in links, e.g. 'race-rocks')
export function findObservationSite(id, sites = OBSERVATION_SITES) {
  return sites.find(site => site.id === id);
}

// The last 12 hourly readings for one site, newest first, cached for 10 minutes
export async function fetchSiteHistory(site) {
  const cacheKey = `siteHistory_${site.sourceId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const history =
    site.type === 'buoy' ? await fetchBuoyHistory(site) : await fetchLighthouseHistory(site);
  setCache(cacheKey, history, OBSERVATIONS_TTL_MS);
  return history;
}

// EC keeps per-minute readings for some stations; ask for the hourly ones only
async function fetchLighthouseHistory(site) {
  const url = 'https://api.weather.gc.ca/collections/swob-realtime/items';
  const params = {
    f: 'json',
    'msc_id-value': site.sourceId,
    '_is-minutely_obs-value': false,
    sortby: '-obs_date_tm',
    limit: HISTORY_HOURS,
  };
  const data = await getJson(url, { params });
  return (data.features ?? [])
    .map(feature => readLighthouseFeature(feature.properties))
    .filter(Boolean);
}

// NOAA's file already holds weeks of hourly rows; take the newest 12
async function fetchBuoyHistory(site) {
  return parseNdbcRows(await getText(currentBuildBuoyUrl(site.sourceId)), HISTORY_HOURS);
}

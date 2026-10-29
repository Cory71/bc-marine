import { getJson } from './http.js';
import { ALL_LOCATIONS, toStationSlug } from '../stations.js';
import { distanceKm } from '../units.js';

// --- Search any BC place name (bays, harbours, communities) ---
// Uses BC Geographical Names, the province's official place-name database. It's free,
// needs no key and allows browser requests. Each match points to its nearest station.

const BC_NAMES_URL = 'https://apps.gov.bc.ca/pub/bcgnws/names/search';
const MAX_RESULTS = 5;
// Places further than this from every station are inland or off our coast
const MAX_KM_FROM_A_STATION = 20;
// Land features people don't mean when they search for somewhere on the water
const LAND_FEATURE_TYPES = [
  'Creek',
  'River',
  'Falls',
  'Lake',
  'Mountain',
  'Peak',
  'Range',
  'Ridge',
  'Glacier',
  'Valley',
  'Hill',
  'Canyon',
  'Pond',
  'Brook',
  'Swamp',
  'Marsh',
];

export function buildPlaceNameUrl(query) {
  const params = new URLSearchParams({
    name: query,
    outputFormat: 'json',
    outputSRS: '4326', // latitude and longitude
    itemsPerPage: '20', // extra, as some get filtered out
  });
  return `${BC_NAMES_URL}?${params.toString().replace(/\+/g, '%20')}`;
}

// Coastal BC place names matching the search, each with its nearest station
export async function searchPlaceNames(query) {
  const json = await getJson(buildPlaceNameUrl(query));
  return readPlaceNames(json, ALL_LOCATIONS);
}

// Turn BC Geographical Names results into [{ name, kind, lat, lon, station, distanceKm }]
export function readPlaceNames(json, locations) {
  const stationSlugs = new Set(locations.map(location => toStationSlug(location.name)));
  const seen = new Set();
  const results = [];

  for (const feature of json?.features ?? []) {
    const result = readOnePlace(feature, locations);
    if (!result || stationSlugs.has(toStationSlug(result.name))) continue;
    // The same name leading to the same station is one place (e.g. a bay and its community)
    const key = `${result.name}|${result.station.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(result);
  }
  return results.slice(0, MAX_RESULTS);
}

// One result, or null when it's a land feature or nowhere near a station
function readOnePlace(feature, locations) {
  const name = feature?.properties?.name;
  const kind = feature?.properties?.featureType ?? '';
  const [lon, lat] = feature?.geometry?.coordinates ?? [];
  if (!name || lat == null || lon == null) return null;
  if (LAND_FEATURE_TYPES.some(type => kind.startsWith(type))) return null;

  const { station, km } = nearestStation(lat, lon, locations);
  if (km > MAX_KM_FROM_A_STATION) return null;
  return { name, kind: tidyKind(kind), lat, lon, station, distanceKm: km };
}

// 'Cove (2)' → 'Cove', 'Indian Reserve-Réserve indienne' → 'Indian Reserve'
function tidyKind(kind) {
  return kind
    .replace(/\s*\(\d+\)$/, '')
    .split('-')[0]
    .trim();
}

function nearestStation(lat, lon, locations) {
  let best = { station: null, km: Infinity };
  for (const station of locations) {
    const km = distanceKm(lat, lon, station.lat, station.lon);
    if (km < best.km) best = { station, km };
  }
  return best;
}

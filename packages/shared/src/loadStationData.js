import { fetchTides, fetchTideEvents, fetchWeeklyTides } from './services/dfoService.js';
import { fetchWeather } from './services/weatherService.js';
import { fetchMarineForecast } from './services/ecService.js';
import { clearCache } from './services/cache.js';
import { getStationRegion } from './stations.js';

// Names for each data set, in the same order as the fetches below
const DATA_KEYS = ['tides', 'tideEvents', 'weeklyTides', 'weather', 'marineForecast'];

// Load every data set for a station. Never throws: a failed fetch gives null
// for that key and its name in `failures`, so callers can keep the old data.
export async function loadStationData(station, { forceRefresh = false } = {}) {
  const region = getStationRegion(station);
  if (forceRefresh) clearStationCache(station, region);

  // allSettled so one broken API doesn't wipe out the others
  const results = await Promise.allSettled([
    fetchTides(station.id),
    fetchTideEvents(station.id),
    fetchWeeklyTides(station.id),
    fetchWeather(station.lat, station.lon),
    fetchMarineForecast(region),
  ]);

  const data = { failures: [] };
  results.forEach((result, i) => {
    const key = DATA_KEYS[i];
    data[key] = result.status === 'fulfilled' ? result.value : null;
    if (result.status === 'rejected') data.failures.push(key);
  });
  return data;
}

// Remove this station's cached data so the next load hits the APIs
function clearStationCache(station, region) {
  clearCache(`tides_${station.id}`);
  clearCache(`tideEvents_${station.id}`);
  clearCache(`weekly_${station.id}`);
  clearCache(`weather_${station.lat}_${station.lon}`);
  clearCache(`ec_${region}`);
}

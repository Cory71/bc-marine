import { fetchTides, fetchTideEvents, fetchWeeklyTides } from './services/dfoService.js';
import { fetchWeather } from './services/weatherService.js';
import { fetchMarineForecast } from './services/ecService.js';
import { fetchNearbyObservations } from './services/observationService.js';
import { clearCache } from './services/cache.js';
import { getStationRegion } from './stations.js';

// Every data set the apps show for a station. To add a new data layer,
// add an entry here: its key in the result, and how to load it.
const DATA_SOURCES = [
  { key: 'tides', load: station => fetchTides(station.id) },
  { key: 'tideEvents', load: station => fetchTideEvents(station.id) },
  { key: 'weeklyTides', load: station => fetchWeeklyTides(station.id) },
  { key: 'weather', load: station => fetchWeather(station.lat, station.lon) },
  { key: 'marineForecast', load: (station, region) => fetchMarineForecast(region) },
  { key: 'observations', load: station => fetchNearbyObservations(station) },
];

// Load every data set for a station. Never throws: a failed fetch gives null
// for that key and its name in `failures`, so callers can keep the old data.
// Optional `onData(key, value)` is called as each source arrives, so screens
// can show fast sources without waiting for the slowest one.
export async function loadStationData(station, { forceRefresh = false, onData } = {}) {
  const region = getStationRegion(station);
  if (forceRefresh) clearStationCache(station, region);

  // allSettled so one broken API doesn't wipe out the others
  const results = await Promise.allSettled(
    DATA_SOURCES.map(async source => {
      const value = await source.load(station, region);
      onData?.(source.key, value);
      return value;
    })
  );

  const data = { failures: [] };
  results.forEach((result, i) => {
    const { key } = DATA_SOURCES[i];
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
  clearCache(`observations_${station.lat}_${station.lon}`);
}

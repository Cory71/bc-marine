import axios from 'axios';
import { API } from '../constants.js';
import { metresToFeet } from '../units.js';
import { setCache, getCache } from './cache.js';
import { parseUtcTimestamp } from '../bcTime.js';

// Fetch hourly marine weather for a lat/lon coordinate using Open-Meteo (free, no key needed)
export async function fetchWeather(lat, lon) {
  const cacheKey = `weather_${lat}_${lon}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  // Fail fast if Open-Meteo is slow or unreachable, so the Dashboard doesn't hang
  const TIMEOUT_MS = 15000;

  // Use allSettled so one failed endpoint doesn't wipe out the other's data
  const [marineResult, weatherResult] = await Promise.allSettled([
    axios.get(API.OPEN_METEO_MARINE, {
      timeout: TIMEOUT_MS,
      params: {
        latitude: lat,
        longitude: lon,
        hourly: 'wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_direction,ocean_current_velocity,ocean_current_direction',
        timezone: 'GMT', // UTC times, so every viewer's device reads them the same way
      },
    }),
    axios.get(API.OPEN_METEO_WEATHER, {
      timeout: TIMEOUT_MS,
      params: {
        latitude: lat,
        longitude: lon,
        hourly: 'windspeed_10m,winddirection_10m,visibility',
        wind_speed_unit: 'kn', // request knots directly
        timezone: 'GMT', // UTC times, so every viewer's device reads them the same way
      },
    }),
  ]);

  // Log endpoint failures so we can see them in the Metro console
  if (marineResult.status === 'rejected') {
    console.warn('[fetchWeather] marine endpoint failed:', marineResult.reason?.message);
  }
  if (weatherResult.status === 'rejected') {
    console.warn('[fetchWeather] weather endpoint failed:', weatherResult.reason?.message);
  }

  // If both endpoints failed, throw so AppContext keeps the previous state
  if (marineResult.status === 'rejected' && weatherResult.status === 'rejected') {
    throw new Error('Both Open-Meteo endpoints failed');
  }

  const marine = marineResult.status === 'fulfilled' ? marineResult.value.data.hourly : null;
  const weather = weatherResult.status === 'fulfilled' ? weatherResult.value.data.hourly : null;

  // Use whichever hourly time array is available (they line up when both are present)
  const timeArray = marine?.time ?? weather?.time;

  // Zip the two hourly arrays together by index — missing fields become null so the UI shows dashes
  const data = timeArray.map((time, i) => ({
    time: parseUtcTimestamp(time),
    windSpeedKts: weather?.windspeed_10m?.[i] ?? null,
    windDirectionDeg: weather?.winddirection_10m?.[i] ?? null,
    waveHeightFt: marine?.wave_height?.[i] != null ? parseFloat(metresToFeet(marine.wave_height[i])) : null,
    wavePeriodS: marine?.wave_period?.[i] ?? null,
    swellHeightFt: marine?.swell_wave_height?.[i] != null ? parseFloat(metresToFeet(marine.swell_wave_height[i])) : null,
    swellDirectionDeg: marine?.swell_wave_direction?.[i] ?? null,
    visibilityKm: weather?.visibility?.[i] != null ? parseFloat((weather.visibility[i] / 1000).toFixed(1)) : null,
    // ocean_current_velocity is in km/h — convert to knots
    currentSpeedKts: marine?.ocean_current_velocity?.[i] != null ? parseFloat((marine.ocean_current_velocity[i] * 0.539957).toFixed(2)) : null,
    currentDirectionDeg: marine?.ocean_current_direction?.[i] ?? null,
  }));

  setCache(cacheKey, data);
  return data;
}

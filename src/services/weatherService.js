import axios from 'axios';
import { API } from '../utils/constants';
import { metresToFeet } from '../utils/units';
import { setCache, getCache } from './cache';

// Fetch hourly marine weather for a lat/lon coordinate using Open-Meteo (free, no key needed)
export async function fetchWeather(lat, lon) {
  const cacheKey = `weather_${lat}_${lon}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  // Fetch marine data (waves, swell, currents) and wind data in parallel
  const [marineRes, weatherRes] = await Promise.all([
    axios.get(API.OPEN_METEO_MARINE, {
      params: {
        latitude: lat,
        longitude: lon,
        hourly: 'wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_direction,ocean_current_velocity,ocean_current_direction',
        timezone: 'America/Vancouver',
      },
    }),
    axios.get(API.OPEN_METEO_WEATHER, {
      params: {
        latitude: lat,
        longitude: lon,
        hourly: 'windspeed_10m,winddirection_10m,visibility',
        wind_speed_unit: 'kn', // request knots directly
        timezone: 'America/Vancouver',
      },
    }),
  ]);

  const marine = marineRes.data.hourly;
  const weather = weatherRes.data.hourly;

  // Zip the two hourly arrays together by index
  const data = marine.time.map((time, i) => ({
    time: new Date(time),
    windSpeedKts: weather.windspeed_10m[i] ?? null,
    windDirectionDeg: weather.winddirection_10m[i] ?? null,
    waveHeightFt: marine.wave_height[i] != null ? parseFloat(metresToFeet(marine.wave_height[i])) : null,
    wavePeriodS: marine.wave_period[i] ?? null,
    swellHeightFt: marine.swell_wave_height[i] != null ? parseFloat(metresToFeet(marine.swell_wave_height[i])) : null,
    swellDirectionDeg: marine.swell_wave_direction[i] ?? null,
    visibilityKm: weather.visibility[i] != null ? parseFloat((weather.visibility[i] / 1000).toFixed(1)) : null,
    // ocean_current_velocity is in km/h — convert to knots
    currentSpeedKts: marine.ocean_current_velocity[i] != null ? parseFloat((marine.ocean_current_velocity[i] * 0.539957).toFixed(2)) : null,
    currentDirectionDeg: marine.ocean_current_direction[i] ?? null,
  }));

  setCache(cacheKey, data);
  return data;
}

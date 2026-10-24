import axios from 'axios';
import { API } from '../utils/constants';
import { metresToFeet } from '../utils/units';
import { setCache, getCache } from './cache';

// Fetch hourly tide predictions for today at a DFO station
export async function fetchTides(stationId) {
  const cacheKey = `tides_${stationId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const today = new Date().toISOString().split('T')[0];
  const url = `${API.DFO_BASE}/stations/${stationId}/data?time-series-code=wlp&from=${today}T00:00:00Z&to=${today}T23:59:59Z&resolution=SIXTY_MINUTES`;

  const response = await axios.get(url);
  // DFO returns an array of { eventDate, value } objects — value is in metres
  const data = response.data.map(item => ({
    time: new Date(item.eventDate),
    heightFt: parseFloat(metresToFeet(item.value)),
  }));

  setCache(cacheKey, data);
  return data;
}

// Fetch high/low tide events for the next 48 hours so NEXT LOW is always visible
export async function fetchTideEvents(stationId) {
  const cacheKey = `tideEvents_${stationId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const url = `${API.DFO_BASE}/stations/${stationId}/data?time-series-code=wlp-hilo&from=${today}T00:00:00Z&to=${tomorrow}T23:59:59Z`;

  const response = await axios.get(url);
  const events = response.data;
  // Tide events always alternate HIGH/LOW. Determine which comes first by comparing
  // the first two values — whichever is larger is the high tide.
  const firstIsHigh = events.length >= 2
    ? events[0].value > events[1].value
    : (events[0]?.value ?? 0) > 0;
  const data = events.map((item, i) => ({
    time: new Date(item.eventDate),
    heightFt: parseFloat(metresToFeet(item.value)),
    type: firstIsHigh === (i % 2 === 0) ? 'HIGH' : 'LOW',
  }));

  setCache(cacheKey, data);
  return data;
}

// Fetch the max tide height for each of the next 7 days (used by Tide Detail screen)
export async function fetchWeeklyTides(stationId) {
  const cacheKey = `weekly_${stationId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const results = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const day = date.toISOString().split('T')[0];
    const label = date.toLocaleDateString('en-CA', { weekday: 'short' });

    const url = `${API.DFO_BASE}/stations/${stationId}/data?time-series-code=wlp-hilo&from=${day}T00:00:00Z&to=${day}T23:59:59Z`;
    const response = await axios.get(url);
    const maxFt = Math.max(...response.data.map(item => parseFloat(metresToFeet(item.value))));
    results.push({ label, maxFt });
  }

  setCache(cacheKey, results);
  return results;
}

import axios from 'axios';
import { API } from '../constants.js';
import { metresToFeet } from '../units.js';
import { setCache, getCache } from './cache.js';
import { getBcDateString, addDaysToDateString, getBcDayRangeUtc, formatBcWeekday } from '../bcTime.js';

// Fetch hourly tide predictions for today (BC day) at a DFO station
export async function fetchTides(stationId) {
  const cacheKey = `tides_${stationId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const { from, to } = getBcDayRangeUtc(getBcDateString());
  const url = `${API.DFO_BASE}/stations/${stationId}/data?time-series-code=wlp&from=${from}&to=${to}&resolution=SIXTY_MINUTES`;

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

  // Start of BC today to end of BC tomorrow
  const today = getBcDateString();
  const { from } = getBcDayRangeUtc(today);
  const { to } = getBcDayRangeUtc(addDaysToDateString(today, 1));
  const url = `${API.DFO_BASE}/stations/${stationId}/data?time-series-code=wlp-hilo&from=${from}&to=${to}`;

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

  // Build the next 7 BC dates, then fetch them all at once instead of one by one
  const today = getBcDateString();
  const days = Array.from({ length: 7 }, (_, i) => addDaysToDateString(today, i));
  // Promise.all keeps the results in day order
  const results = await Promise.all(days.map(day => fetchDayMaxTide(stationId, day)));

  setCache(cacheKey, results);
  return results;
}

// Fetch one BC day's high/low events and return its weekday label and highest tide
async function fetchDayMaxTide(stationId, day) {
  const { from, to } = getBcDayRangeUtc(day);
  const url = `${API.DFO_BASE}/stations/${stationId}/data?time-series-code=wlp-hilo&from=${from}&to=${to}`;
  const response = await axios.get(url);
  const maxFt = Math.max(...response.data.map(item => parseFloat(metresToFeet(item.value))));
  // Noon UTC on that date is the same calendar day in BC, so the weekday is right
  const label = formatBcWeekday(`${day}T12:00:00Z`);
  return { label, maxFt };
}

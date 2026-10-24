import { test, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { fetchTides, fetchTideEvents, fetchWeeklyTides, clearCache } from '../src/index.js';

vi.mock('axios');

const STATION_ID = 'abc';

beforeEach(() => {
  vi.useFakeTimers();
  // 8:30 pm PDT on Oct 24 — already Oct 25 in UTC
  vi.setSystemTime(new Date('2026-10-25T03:30:00Z'));
  vi.mocked(axios.get).mockReset();
  for (const key of ['tides', 'tideEvents', 'weekly']) clearCache(`${key}_${STATION_ID}`);
});
afterEach(() => vi.useRealTimers());

test('fetchTides asks DFO for the BC day, not the UTC day', async () => {
  axios.get.mockResolvedValue({ data: [] });
  await fetchTides(STATION_ID);
  expect(axios.get.mock.calls[0][0]).toContain('from=2026-10-24T07:00:00Z&to=2026-10-25T06:59:59Z');
});

test('fetchTideEvents covers BC today and tomorrow', async () => {
  axios.get.mockResolvedValue({ data: [] });
  await fetchTideEvents(STATION_ID);
  expect(axios.get.mock.calls[0][0]).toContain('from=2026-10-24T07:00:00Z&to=2026-10-26T06:59:59Z');
});

test('fetchWeeklyTides returns 7 days labelled Sat..Fri in order', async () => {
  axios.get.mockResolvedValue({ data: [{ eventDate: 'x', value: 1 }] });
  const week = await fetchWeeklyTides(STATION_ID);
  expect(week.map(day => day.label)).toEqual(['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  expect(axios.get).toHaveBeenCalledTimes(7);
});

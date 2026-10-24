import { test, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchTides, fetchTideEvents, fetchWeeklyTides, clearCache } from '../src/index.js';

const STATION_ID = 'abc';

// Fake fetch that answers every request with the same JSON body
function stubFetchJson(body) {
  const fetchMock = vi.fn(() => Promise.resolve(new Response(JSON.stringify(body))));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  // 8:30 pm PDT on Oct 24 — already Oct 25 in UTC
  vi.setSystemTime(new Date('2026-10-25T03:30:00Z'));
  for (const key of ['tides', 'tideEvents', 'weekly']) clearCache(`${key}_${STATION_ID}`);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test('fetchTides asks DFO for the BC day, not the UTC day', async () => {
  const fetchMock = stubFetchJson([]);
  await fetchTides(STATION_ID);
  expect(fetchMock.mock.calls[0][0]).toContain('from=2026-10-24T07:00:00Z&to=2026-10-25T06:59:59Z');
});

test('fetchTideEvents covers BC today and tomorrow', async () => {
  const fetchMock = stubFetchJson([]);
  await fetchTideEvents(STATION_ID);
  expect(fetchMock.mock.calls[0][0]).toContain('from=2026-10-24T07:00:00Z&to=2026-10-26T06:59:59Z');
});

test('fetchWeeklyTides returns 7 days labelled Sat..Fri in order', async () => {
  const fetchMock = stubFetchJson([{ eventDate: 'x', value: 1 }]);
  const week = await fetchWeeklyTides(STATION_ID);
  expect(week.map(day => day.label)).toEqual(['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  expect(fetchMock).toHaveBeenCalledTimes(7);
});

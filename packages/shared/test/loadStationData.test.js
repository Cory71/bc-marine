import { test, expect, vi, beforeEach } from 'vitest';
import { fetchTides, fetchTideEvents, fetchWeeklyTides } from '../src/services/dfoService.js';
import { fetchWeather } from '../src/services/weatherService.js';
import { fetchMarineForecast } from '../src/services/ecService.js';
import * as cache from '../src/services/cache.js';
import { loadStationData } from '../src/loadStationData.js';

vi.mock('../src/services/dfoService.js');
vi.mock('../src/services/weatherService.js');
vi.mock('../src/services/ecService.js');

const victoria = {
  id: 'vic',
  name: 'Victoria',
  lat: 48.4,
  lon: -123.4,
  region: 'Juan de Fuca Strait',
};
const MOCK_TIDES = [{ time: new Date(), heightFt: 5 }];

beforeEach(() => {
  vi.restoreAllMocks();
  fetchTides.mockResolvedValue(MOCK_TIDES);
  fetchTideEvents.mockResolvedValue([]);
  fetchWeeklyTides.mockResolvedValue([]);
  fetchWeather.mockResolvedValue([]);
  fetchMarineForecast.mockRejectedValue(new Error('EC down'));
});

test('loadStationData returns data and lists failures without throwing', async () => {
  const result = await loadStationData(victoria);
  expect(result.marineForecast).toBeNull();
  expect(result.failures).toEqual(['marineForecast']);
  expect(result.tides).toEqual(MOCK_TIDES);
});

test('forceRefresh clears the five cache keys', async () => {
  const clearSpy = vi.spyOn(cache, 'clearCache');
  await loadStationData(victoria, { forceRefresh: true });
  expect(clearSpy.mock.calls.map(call => call[0])).toEqual([
    'tides_vic',
    'tideEvents_vic',
    'weekly_vic',
    'weather_48.4_-123.4',
    'ec_Juan de Fuca Strait',
  ]);
});

test('without forceRefresh the cache is left alone', async () => {
  const clearSpy = vi.spyOn(cache, 'clearCache');
  await loadStationData(victoria);
  expect(clearSpy).not.toHaveBeenCalled();
});

test('onData reports each source as soon as it arrives, without waiting for the slowest', async () => {
  // Weekly tides never finish during this check; the others resolve right away
  let finishWeekly;
  fetchWeeklyTides.mockReturnValue(new Promise(resolve => (finishWeekly = resolve)));
  const received = [];

  const loading = loadStationData(victoria, { onData: key => received.push(key) });
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(received).toEqual(['tides', 'tideEvents', 'weather']);

  finishWeekly([]);
  const result = await loading;
  expect(received).toContain('weeklyTides');
  expect(received).not.toContain('marineForecast'); // failed sources aren't reported to onData
  expect(result.failures).toEqual(['marineForecast']);
});

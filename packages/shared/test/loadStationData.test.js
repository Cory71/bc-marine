import { test, expect, vi, beforeEach } from 'vitest';
import { fetchTides, fetchTideEvents, fetchWeeklyTides } from '../src/services/dfoService.js';
import { fetchWeather } from '../src/services/weatherService.js';
import { fetchMarineForecast } from '../src/services/ecService.js';
import * as cache from '../src/services/cache.js';
import { loadStationData } from '../src/loadStationData.js';

vi.mock('../src/services/dfoService.js');
vi.mock('../src/services/weatherService.js');
vi.mock('../src/services/ecService.js');

const victoria = { id: 'vic', name: 'Victoria', lat: 48.4, lon: -123.4, region: 'Juan de Fuca Strait' };
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

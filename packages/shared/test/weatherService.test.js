import { test, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { fetchWeather, clearCache } from '../src/index.js';

vi.mock('axios');

beforeEach(() => {
  vi.mocked(axios.get).mockReset();
  clearCache('weather_48.4_-123.4');
});

test('fetchWeather requests GMT and parses times as UTC', async () => {
  axios.get.mockResolvedValue({ data: { hourly: { time: ['2026-10-25T03:00'], windspeed_10m: [10] } } });
  const [first] = await fetchWeather(48.4, -123.4);
  expect(axios.get.mock.calls[0][1].params.timezone).toBe('GMT');
  expect(axios.get.mock.calls[1][1].params.timezone).toBe('GMT');
  expect(first.time.toISOString()).toBe('2026-10-25T03:00:00.000Z');
});

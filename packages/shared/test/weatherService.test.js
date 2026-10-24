import { test, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWeather, clearCache } from '../src/index.js';

beforeEach(() => clearCache('weather_48.4_-123.4'));
afterEach(() => vi.unstubAllGlobals());

test('fetchWeather requests GMT and parses times as UTC', async () => {
  const body = { hourly: { time: ['2026-10-25T03:00'], windspeed_10m: [10] } };
  const fetchMock = vi.fn(() => Promise.resolve(new Response(JSON.stringify(body))));
  vi.stubGlobal('fetch', fetchMock);

  const [first] = await fetchWeather(48.4, -123.4);
  const requestedUrls = fetchMock.mock.calls.map(call => new URL(call[0]));
  expect(requestedUrls.map(url => url.searchParams.get('timezone'))).toEqual(['GMT', 'GMT']);
  expect(first.time.toISOString()).toBe('2026-10-25T03:00:00.000Z');
  expect(first.windSpeedKts).toBe(10);
});

test('one failed endpoint still returns the other one', async () => {
  const body = { hourly: { time: ['2026-10-25T03:00'], windspeed_10m: [12] } };
  // Marine endpoint fails, forecast endpoint answers
  const fetchMock = vi.fn(url =>
    Promise.resolve(
      url.includes('marine')
        ? new Response('', { status: 500 })
        : new Response(JSON.stringify(body))
    )
  );
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'warn').mockImplementation(() => {});

  const [first] = await fetchWeather(48.4, -123.4);
  expect(first.windSpeedKts).toBe(12);
  expect(first.waveHeightFt).toBeNull();
});

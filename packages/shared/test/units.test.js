import { test, expect } from 'vitest';
import {
  metresToFeet,
  degreesToCardinal,
  degreesToCompass,
  findNearestStation,
  distanceKm,
  formatTime,
  timeSince,
  BC_STATIONS,
} from '../src/index.js';

test('runs in a non-Pacific zone', () => {
  expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('America/Toronto');
});

test('metresToFeet', () => expect(metresToFeet(1)).toBe('3.3'));

test('degreesToCardinal', () => {
  expect(degreesToCardinal(0)).toBe('N');
  expect(degreesToCardinal(225)).toBe('SW');
  expect(degreesToCardinal(359)).toBe('N');
});

test('findNearestStation picks Victoria for a downtown Victoria point', () => {
  expect(findNearestStation(48.42, -123.37, BC_STATIONS).name).toBe('Victoria');
});

test('formatTime shows BC time to a Toronto viewer', () =>
  expect(formatTime(new Date('2026-10-24T16:15:00Z'))).toBe('9:15 AM'));

test('timeSince adds PT', () =>
  expect(timeSince(new Date('2026-10-24T16:15:00Z'))).toBe('Updated 9:15 AM PT'));

test('degreesToCompass gives 16 points and handles missing values', () => {
  expect(degreesToCompass(0)).toBe('N');
  expect(degreesToCompass(157.5)).toBe('SSE');
  expect(degreesToCompass(350)).toBe('N');
  expect(degreesToCompass(null)).toBe('--');
});

test('distanceKm measures real distance (Victoria to Race Rocks is about 18 km)', () => {
  const km = distanceKm(48.4244, -123.3699, 48.2983, -123.5317);
  expect(km).toBeGreaterThan(17);
  expect(km).toBeLessThan(19);
  expect(distanceKm(48.4, -123.4, 48.4, -123.4)).toBe(0);
});

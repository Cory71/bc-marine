import { test, expect } from 'vitest';
import {
  metresToFeet,
  degreesToCardinal,
  degreesToCompass,
  findNearestStation,
  isRoughLocation,
  distanceKm,
  formatTime,
  formatHourLabel,
  getSunMoon,
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

test('findNearestStation measures real distance, not raw degrees', () => {
  // East is 0.30° of longitude (about 22 km here); north is 0.25° of latitude (about 28 km)
  const east = { name: 'East', lat: 49.0, lon: -122.7 };
  const north = { name: 'North', lat: 49.25, lon: -123.0 };
  expect(findNearestStation(49.0, -123.0, [north, east]).name).toBe('East');
});

test('isRoughLocation flags a device fix that is only known to 10 km or worse', () => {
  expect(isRoughLocation(50)).toBe(false);
  expect(isRoughLocation(9000)).toBe(false);
  expect(isRoughLocation(10000)).toBe(true);
  expect(isRoughLocation(45000)).toBe(true);
  expect(isRoughLocation(undefined)).toBe(false);
});

test('times follow the chosen clock', () => {
  const clock24 = { time: '24h' };
  expect(formatTime(new Date('2026-10-24T23:05:00Z'), clock24)).toBe('16:05');
  expect(timeSince(new Date('2026-10-24T23:05:00Z'), clock24)).toBe('Updated 16:05 PT');
  expect(getSunMoon(48.42, -123.37, clock24).sunrise).toMatch(/^\d{2}:\d{2}$/);
});

test('formatHourLabel gives short chart labels on either clock', () => {
  const sixAm = new Date('2026-10-24T13:00:00Z');
  expect(formatHourLabel(sixAm)).toBe('6 AM');
  expect(formatHourLabel(sixAm, { time: '24h' })).toBe('06:00');
});

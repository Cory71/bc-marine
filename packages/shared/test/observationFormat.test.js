import { test, expect } from 'vitest';
import {
  formatWind,
  formatGust,
  formatWaves,
  formatWavePeriod,
  formatPressure,
  formatTemp,
  formatDistance,
  formatReadingAge,
  isOldReading,
  summarizeObservation,
  observationDetail,
} from '../src/index.js';

const NOW = new Date('2026-10-25T23:30:00Z');

const LIGHTHOUSE_READING = {
  observedAt: new Date('2026-10-25T23:29:00Z'),
  windKts: 17,
  windDirDeg: 86,
  gustKts: 25,
  waveHeightFt: null,
  wavePeriodS: null,
  pressureHpa: 1007.5,
  airTempC: 11.3,
  waterTempC: null,
};

const BUOY_READING = {
  ...LIGHTHOUSE_READING,
  observedAt: new Date('2026-10-25T22:50:00Z'),
  windKts: 8,
  windDirDeg: 270,
  gustKts: 8,
  waveHeightFt: 1.3,
  wavePeriodS: 4,
  pressureHpa: 1014.5,
  waterTempC: 11.1,
};

test('formats each reading value with its unit', () => {
  expect(formatWind(LIGHTHOUSE_READING)).toBe('E 17 kts');
  expect(formatWind({ ...LIGHTHOUSE_READING, windDirDeg: null })).toBe('17 kts');
  expect(formatGust(LIGHTHOUSE_READING)).toBe('25 kts');
  expect(formatWaves(BUOY_READING)).toBe('1.3 ft');
  expect(formatWavePeriod(BUOY_READING)).toBe('4 s');
  expect(formatPressure(LIGHTHOUSE_READING)).toBe('1007.5 hPa');
  expect(formatTemp(11.3)).toBe('11.3 °C');
  expect(formatDistance(17.6)).toBe('18 km');
});

test('missing values show as --', () => {
  expect(formatWind({ ...LIGHTHOUSE_READING, windKts: null, windDirDeg: null })).toBe('--');
  expect(formatWaves(LIGHTHOUSE_READING)).toBe('--');
  expect(formatTemp(null)).toBe('--');
});

test('formatReadingAge says how long ago a reading was taken', () => {
  expect(formatReadingAge(new Date('2026-10-25T23:29:40Z'), NOW)).toBe('just now');
  expect(formatReadingAge(new Date('2026-10-25T23:29:00Z'), NOW)).toBe('1 min ago');
  expect(formatReadingAge(new Date('2026-10-25T22:50:00Z'), NOW)).toBe('40 min ago');
  expect(formatReadingAge(new Date('2026-10-25T21:20:00Z'), NOW)).toBe('2 h ago');
});

test('readings older than 3 hours count as old', () => {
  expect(isOldReading(new Date('2026-10-25T20:31:00Z'), NOW)).toBe(false);
  expect(isOldReading(new Date('2026-10-25T20:29:00Z'), NOW)).toBe(true);
});

test('summarizeObservation gives the short dashboard line', () => {
  expect(summarizeObservation({ site: { type: 'lighthouse' }, reading: LIGHTHOUSE_READING })).toBe(
    'E 17 kts, gust 25 kts'
  );
  expect(summarizeObservation({ site: { type: 'buoy' }, reading: BUOY_READING })).toBe(
    'W 8 kts, gust 8 kts · waves 1.3 ft'
  );
  expect(summarizeObservation({ site: { type: 'buoy' }, reading: null })).toBe('No recent report');
});

test('readings 48 hours or older show their age in days', () => {
  expect(formatReadingAge(new Date('2026-10-23T21:30:00Z'), NOW)).toBe('2 d ago');
  expect(formatReadingAge(new Date('2026-10-24T00:30:00Z'), NOW)).toBe('47 h ago');
});

test('observationDetail gives gust for lighthouses, and gust and waves for buoys', () => {
  const buoy = reading => observationDetail({ site: { type: 'buoy' }, reading });
  expect(observationDetail({ site: { type: 'lighthouse' }, reading: LIGHTHOUSE_READING })).toBe(
    'gust 25 kts'
  );
  expect(buoy(BUOY_READING)).toBe('gust 8 kts · waves 1.3 ft');
  expect(buoy({ ...BUOY_READING, waveHeightFt: null })).toBe('gust 8 kts');
  expect(buoy({ ...BUOY_READING, gustKts: null })).toBe('waves 1.3 ft');
  expect(buoy({ ...BUOY_READING, gustKts: null, waveHeightFt: null })).toBe('');
  expect(observationDetail({ site: { type: 'buoy' }, reading: null })).toBe('');
});

test('observation text follows the chosen units', () => {
  const metric = { speed: 'kmh', height: 'm', temperature: 'c', distance: 'km' };
  expect(formatWind(LIGHTHOUSE_READING, metric)).toBe('E 31 km/h');
  expect(observationDetail({ site: { type: 'buoy' }, reading: BUOY_READING }, metric)).toBe(
    'gust 15 km/h · waves 0.4 m'
  );
});

test('formatPressure follows the chosen pressure unit', () => {
  expect(formatPressure(LIGHTHOUSE_READING, { pressure: 'kpa' })).toBe('100.75 kPa');
  expect(formatPressure({ pressureHpa: null }, { pressure: 'inhg' })).toBe('--');
});

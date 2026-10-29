import { test, expect } from 'vitest';
import {
  DEFAULT_UNITS,
  UNIT_OPTIONS,
  normalizeUnits,
  formatSpeed,
  speedInUnits,
  formatHeight,
  heightInUnits,
  formatTemp,
  formatDistance,
  formatPressureHpa,
  pressureInUnits,
  unitLabel,
} from '../src/index.js';

const METRIC = { speed: 'kmh', height: 'm', temperature: 'f', distance: 'nm' };

test('the defaults are the units the app has always used', () =>
  expect(DEFAULT_UNITS).toEqual({
    speed: 'kts',
    height: 'ft',
    temperature: 'c',
    distance: 'km',
    pressure: 'hpa',
  }));

test('every unit kind offers its default as an option', () => {
  for (const [kind, value] of Object.entries(DEFAULT_UNITS)) {
    expect(UNIT_OPTIONS[kind].map(option => option.value)).toContain(value);
  }
});

test('normalizeUnits keeps valid saved choices and fills or fixes the rest', () => {
  expect(normalizeUnits({ speed: 'mph', height: 'yards' })).toEqual({
    ...DEFAULT_UNITS,
    speed: 'mph',
  });
  expect(normalizeUnits(null)).toEqual(DEFAULT_UNITS);
  expect(normalizeUnits('not an object')).toEqual(DEFAULT_UNITS);
});

test('formatSpeed converts knots', () => {
  expect(formatSpeed(10)).toBe('10 kts');
  expect(formatSpeed(10, { ...DEFAULT_UNITS, speed: 'kmh' })).toBe('19 km/h');
  expect(formatSpeed(10, { ...DEFAULT_UNITS, speed: 'mph' })).toBe('12 mph');
  expect(formatSpeed(0.64, DEFAULT_UNITS, 1)).toBe('0.6 kts');
  expect(formatSpeed(0.64, METRIC, 1)).toBe('1.2 km/h');
  expect(formatSpeed(null)).toBe('--');
});

test('speedInUnits gives a plain number for charts', () => {
  expect(speedInUnits(10)).toBe(10);
  expect(speedInUnits(10, METRIC)).toBeCloseTo(18.52, 5);
  expect(speedInUnits(10, { ...DEFAULT_UNITS, speed: 'mph' })).toBeCloseTo(11.50779, 5);
});

test('formatHeight converts feet', () => {
  expect(formatHeight(8.4)).toBe('8.4 ft');
  expect(formatHeight(8.4, METRIC)).toBe('2.6 m');
  expect(formatHeight(null, METRIC)).toBe('--');
  expect(heightInUnits(3.28084, METRIC)).toBeCloseTo(1, 5);
  expect(heightInUnits(5, DEFAULT_UNITS)).toBe(5);
});

test('formatTemp and formatDistance convert too', () => {
  expect(formatTemp(11.3)).toBe('11.3 °C');
  expect(formatTemp(10, METRIC)).toBe('50 °F');
  expect(formatDistance(17.6)).toBe('18 km');
  expect(formatDistance(18.52, METRIC)).toBe('10 nm');
  expect(formatDistance(null)).toBe('--');
});

test('pressure can be hPa (mb), kPa or inHg, with hPa the default', () => {
  expect(UNIT_OPTIONS.pressure.map(option => option.label)).toEqual(['hPa (mb)', 'kPa', 'inHg']);
  expect(unitLabel('pressure', 'hpa')).toBe('hPa');
  expect(normalizeUnits({ speed: 'mph' }).pressure).toBe('hpa');
  expect(normalizeUnits({ pressure: 'inhg' }).pressure).toBe('inhg');
});

test('formatPressureHpa converts hPa, with 2 decimals for kPa and inHg', () => {
  expect(formatPressureHpa(1015.6)).toBe('1015.6 hPa');
  expect(formatPressureHpa(1015.6, { ...DEFAULT_UNITS, pressure: 'kpa' })).toBe('101.56 kPa');
  expect(formatPressureHpa(1015.6, { ...DEFAULT_UNITS, pressure: 'inhg' })).toBe('29.99 inHg');
  expect(formatPressureHpa(null)).toBe('--');
  expect(pressureInUnits(1013.25, { ...DEFAULT_UNITS, pressure: 'inhg' })).toBeCloseTo(29.921, 3);
});

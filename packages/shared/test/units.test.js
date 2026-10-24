import { test, expect } from 'vitest';
import { metresToFeet, degreesToCardinal, findNearestStation, BC_STATIONS } from '../src/index.js';

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

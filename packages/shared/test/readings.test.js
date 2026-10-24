import { test, expect } from 'vitest';
import { findClosestReading, getNextTideEvent, getCurrentPhase, hasCurrentData } from '../src/index.js';

const NOW = new Date('2026-10-24T17:20:00Z');

// Build an hourly reading at the given UTC hour on Oct 24
function reading(hour, fields = {}) {
  return { time: new Date(Date.UTC(2026, 9, 24, hour)), ...fields };
}

test('findClosestReading picks the nearest hour', () => {
  const readings = [reading(16), reading(17), reading(18)];
  expect(findClosestReading(readings, NOW)).toBe(readings[1]);
});

test('findClosestReading returns null for empty input', () => expect(findClosestReading([])).toBeNull());

test('getNextTideEvent finds the next LOW after now', () => {
  const events = [
    reading(15, { type: 'LOW' }),
    reading(19, { type: 'HIGH' }),
    reading(23, { type: 'LOW' }),
  ];
  expect(getNextTideEvent(events, 'LOW', NOW)).toBe(events[2]);
});

test('getNextTideEvent with no type finds the next event of any kind', () => {
  const events = [reading(15, { type: 'LOW' }), reading(19, { type: 'HIGH' })];
  expect(getNextTideEvent(events, undefined, NOW)).toBe(events[1]);
});

test('getNextTideEvent returns null when nothing is ahead', () =>
  expect(getNextTideEvent([reading(15, { type: 'LOW' })], 'LOW', NOW)).toBeNull());

test('getCurrentPhase is null when there is no current data', () =>
  expect(getCurrentPhase([{ time: new Date(), currentSpeedKts: null }])).toBeNull());

test('getCurrentPhase is Flooding when speed is rising', () => {
  const weather = [reading(16, { currentSpeedKts: 0.5 }), reading(17, { currentSpeedKts: 0.8 })];
  expect(getCurrentPhase(weather, NOW)).toBe('Flooding');
});

test('getCurrentPhase is Ebbing when speed is falling', () => {
  const weather = [reading(16, { currentSpeedKts: 0.8 }), reading(17, { currentSpeedKts: 0.5 })];
  expect(getCurrentPhase(weather, NOW)).toBe('Ebbing');
});

test('hasCurrentData false for all-null speeds', () => {
  expect(hasCurrentData([reading(16, { currentSpeedKts: null })])).toBe(false);
  expect(hasCurrentData([reading(16, { currentSpeedKts: 0.2 })])).toBe(true);
  expect(hasCurrentData(null)).toBe(false);
});

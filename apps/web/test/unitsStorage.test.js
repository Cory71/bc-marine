import { test, expect } from 'vitest';
import { readUnits, writeUnits } from '../src/context/unitsStorage.js';
import { DEFAULT_UNITS } from '@bc-marine/shared';

// A tiny in-memory stand-in for localStorage
function memoryStorage() {
  const data = {};
  return {
    getItem: key => data[key] ?? null,
    setItem: (key, value) => (data[key] = String(value)),
  };
}

test('nothing saved gives the default units', () =>
  expect(readUnits(memoryStorage())).toEqual(DEFAULT_UNITS));

test('saved units round-trip', () => {
  const storage = memoryStorage();
  writeUnits({ ...DEFAULT_UNITS, height: 'm' }, storage);
  expect(readUnits(storage)).toEqual({ ...DEFAULT_UNITS, height: 'm' });
});

test('blocked storage or bad data falls back to the defaults', () => {
  expect(
    readUnits({
      getItem() {
        throw new Error('blocked');
      },
    })
  ).toEqual(DEFAULT_UNITS);
  expect(readUnits({ getItem: () => '{bad json' })).toEqual(DEFAULT_UNITS);
  expect(() =>
    writeUnits(DEFAULT_UNITS, {
      setItem() {
        throw new Error('quota');
      },
    })
  ).not.toThrow();
});

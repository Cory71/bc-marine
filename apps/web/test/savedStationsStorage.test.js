import { test, expect } from 'vitest';
import { readSavedSlugs, writeSavedSlugs } from '../src/context/savedStationsStorage.js';

// A tiny in-memory stand-in for localStorage
function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: key => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value); },
  };
}

test('readSavedSlugs returns Victoria when nothing is saved', () =>
  expect(readSavedSlugs(memoryStorage())).toEqual(['victoria']));

test('readSavedSlugs falls back when storage throws', () => {
  const broken = { getItem() { throw new Error('blocked'); } };
  expect(readSavedSlugs(broken)).toEqual(['victoria']);
});

test('readSavedSlugs falls back on bad JSON', () => {
  expect(readSavedSlugs({ getItem: () => '{not json' })).toEqual(['victoria']);
});

test('readSavedSlugs falls back when the JSON is not a list of strings', () => {
  expect(readSavedSlugs({ getItem: () => '{"a":1}' })).toEqual(['victoria']);
});

test('writeSavedSlugs then readSavedSlugs round-trips', () => {
  const storage = memoryStorage();
  writeSavedSlugs(['tofino', 'sidney'], storage);
  expect(readSavedSlugs(storage)).toEqual(['tofino', 'sidney']);
});

test('writeSavedSlugs swallows quota errors', () => {
  expect(() => writeSavedSlugs(['tofino'], { setItem() { throw new Error('quota'); } })).not.toThrow();
});

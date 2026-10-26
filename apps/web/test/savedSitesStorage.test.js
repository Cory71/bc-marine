import { test, expect } from 'vitest';
import { readSavedSiteIds, writeSavedSiteIds } from '../src/context/savedSitesStorage.js';

// A tiny in-memory stand-in for localStorage
function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: key => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    },
  };
}

test('readSavedSiteIds returns an empty list when nothing is saved', () =>
  expect(readSavedSiteIds(memoryStorage())).toEqual([]));

test('readSavedSiteIds falls back to an empty list when storage throws', () => {
  const broken = {
    getItem() {
      throw new Error('blocked');
    },
  };
  expect(readSavedSiteIds(broken)).toEqual([]);
});

test('readSavedSiteIds falls back on bad JSON or a list that is not all strings', () => {
  expect(readSavedSiteIds({ getItem: () => '{not json' })).toEqual([]);
  expect(readSavedSiteIds({ getItem: () => '[1, 2]' })).toEqual([]);
});

test('writeSavedSiteIds then readSavedSiteIds round-trips under the savedSites key', () => {
  const storage = memoryStorage();
  writeSavedSiteIds(['race-rocks', 'halibut-bank'], storage);
  expect(storage.getItem('savedSites')).toBe('["race-rocks","halibut-bank"]');
  expect(readSavedSiteIds(storage)).toEqual(['race-rocks', 'halibut-bank']);
});

test('writeSavedSiteIds swallows quota errors', () => {
  const full = {
    setItem() {
      throw new Error('quota');
    },
  };
  expect(() => writeSavedSiteIds(['race-rocks'], full)).not.toThrow();
});

import { test, expect, vi, beforeEach, afterEach } from 'vitest';
import { setCache, getCache, clearCache } from '../src/index.js';

const MINUTE_MS = 60 * 1000;

// Fake timers let us move the clock forward without waiting
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

test('getCache returns data before 30 min and null after', () => {
  setCache('k', 1);
  vi.advanceTimersByTime(29 * MINUTE_MS);
  expect(getCache('k')).toBe(1);
  vi.advanceTimersByTime(2 * MINUTE_MS);
  expect(getCache('k')).toBeNull();
});

test('clearCache removes the entry', () => {
  setCache('k2', 'data');
  clearCache('k2');
  expect(getCache('k2')).toBeNull();
});

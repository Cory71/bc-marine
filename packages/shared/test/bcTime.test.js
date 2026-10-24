import { test, expect } from 'vitest';
import {
  BC_TIME_ZONE,
  parseUtcTimestamp,
  getBcDateString,
  addDaysToDateString,
  getBcDayRangeUtc,
  formatBcTime,
  formatBcWeekday,
} from '../src/index.js';

test('BC_TIME_ZONE is Vancouver', () => expect(BC_TIME_ZONE).toBe('America/Vancouver'));

test('parseUtcTimestamp treats text as UTC', () =>
  expect(parseUtcTimestamp('2026-10-24T17:00').toISOString()).toBe('2026-10-24T17:00:00.000Z'));

test('evening in BC is still the same BC day', () =>
  expect(getBcDateString(new Date('2026-10-25T03:30:00Z'))).toBe('2026-10-24')); // 8:30 pm PDT

test('addDaysToDateString crosses month end', () =>
  expect(addDaysToDateString('2026-10-31', 1)).toBe('2026-11-01'));

test('day range in PDT', () =>
  expect(getBcDayRangeUtc('2026-10-24')).toEqual({ from: '2026-10-24T07:00:00Z', to: '2026-10-25T06:59:59Z' }));

test('day range on DST end day (25 h day)', () =>
  expect(getBcDayRangeUtc('2026-11-01')).toEqual({ from: '2026-11-01T07:00:00Z', to: '2026-11-02T07:59:59Z' }));

test('day range on DST start day (23 h day)', () =>
  expect(getBcDayRangeUtc('2026-03-08')).toEqual({ from: '2026-03-08T08:00:00Z', to: '2026-03-09T06:59:59Z' }));

test('formatBcTime shows Pacific time to a Toronto viewer', () =>
  expect(formatBcTime(new Date('2026-10-24T16:15:00Z'))).toBe('9:15 AM'));

test('formatBcTime shows PM in the afternoon', () =>
  expect(formatBcTime(new Date('2026-10-24T23:05:00Z'))).toBe('4:05 PM'));

test('formatBcWeekday', () =>
  expect(formatBcWeekday(new Date('2026-10-25T03:30:00Z'))).toBe('Sat'));

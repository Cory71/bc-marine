import { test, expect } from 'vitest';
import { getWarningRank, isSevereWarning, sortWarningsBySeverity } from '../src/index.js';

test('ranks EC marine warnings from strong wind up to hurricane force', () => {
  expect(getWarningRank('STRONG WIND WARNING IN EFFECT')).toBe(1);
  expect(getWarningRank('Gale warning in effect, Juan de Fuca Strait')).toBe(2);
  expect(getWarningRank('STORM WARNING IN EFFECT')).toBe(3);
  expect(getWarningRank('HURRICANE FORCE WIND WARNING IN EFFECT')).toBe(4);
  expect(getWarningRank('FREEZING SPRAY WARNING IN EFFECT')).toBe(0);
});

test('only gale and above count as severe', () => {
  expect(isSevereWarning('STRONG WIND WARNING IN EFFECT')).toBe(false);
  expect(isSevereWarning('FREEZING SPRAY WARNING IN EFFECT')).toBe(false);
  expect(isSevereWarning('GALE WARNING IN EFFECT')).toBe(true);
  expect(isSevereWarning('STORM WARNING IN EFFECT')).toBe(true);
});

test('sortWarningsBySeverity puts the most severe first without changing the input', () => {
  const warnings = [
    { title: 'STRONG WIND WARNING IN EFFECT' },
    { title: 'STORM WARNING IN EFFECT' },
    { title: 'GALE WARNING IN EFFECT' },
  ];
  expect(sortWarningsBySeverity(warnings).map(w => w.title.split(' ')[0])).toEqual([
    'STORM',
    'GALE',
    'STRONG',
  ]);
  expect(warnings[0].title).toBe('STRONG WIND WARNING IN EFFECT');
});

test('an ended warning is no longer severe, so it shows amber', () => {
  expect(getWarningRank('GALE WARNING ENDED, WEST COAST VANCOUVER ISLAND SOUTH')).toBe(0);
  expect(isSevereWarning('GALE WARNING ENDED , WEST COAST VANCOUVER ISLAND SOUTH')).toBe(false);
  expect(isSevereWarning('Storm warning ended')).toBe(false);
});

test('when a gale ends and a strong wind warning starts, the strong wind warning leads', () => {
  const warnings = [{ title: 'GALE WARNING ENDED' }, { title: 'STRONG WIND WARNING IN EFFECT' }];
  expect(sortWarningsBySeverity(warnings)[0].title).toBe('STRONG WIND WARNING IN EFFECT');
});

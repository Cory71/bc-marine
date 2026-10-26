import { test, expect } from 'vitest';
import {
  DEFAULT_THEME,
  THEME_OPTIONS,
  normalizeTheme,
  resolveTheme,
} from '../src/themePreference.js';

test('the default is to follow the device', () => {
  expect(DEFAULT_THEME).toBe('device');
  expect(THEME_OPTIONS.map(option => option.value)).toEqual(['device', 'light', 'dark']);
});

test('saved choices are kept, anything else gives the default', () => {
  expect(normalizeTheme('light')).toBe('light');
  expect(normalizeTheme('dark')).toBe('dark');
  expect(normalizeTheme('purple')).toBe('device');
  expect(normalizeTheme(null)).toBe('device');
});

test('"device" uses the phone or computer setting, which is dark when unknown', () => {
  expect(resolveTheme('device', 'light')).toBe('light');
  expect(resolveTheme('device', 'dark')).toBe('dark');
  expect(resolveTheme('device', null)).toBe('dark');
  expect(resolveTheme('light', 'dark')).toBe('light');
  expect(resolveTheme('dark', 'light')).toBe('dark');
});

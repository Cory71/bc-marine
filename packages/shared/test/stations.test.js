import { test, expect } from 'vitest';
import {
  ALL_LOCATIONS,
  toStationSlug,
  findStationBySlug,
  getDefaultStation,
  getStationRegion,
} from '../src/index.js';

test('toStationSlug lowercases and dashes', () => {
  expect(toStationSlug('Port McNeill')).toBe('port-mcneill');
  expect(toStationSlug('  Juan de Fuca & South  ')).toBe('juan-de-fuca-south');
});

test('slugs are unique across ALL_LOCATIONS', () => {
  const slugs = ALL_LOCATIONS.map(s => toStationSlug(s.name));
  expect(new Set(slugs).size).toBe(slugs.length);
});

test('findStationBySlug round-trips and rejects unknown', () => {
  expect(findStationBySlug('port-mcneill').name).toBe('Port McNeill');
  expect(findStationBySlug('gibsons').name).toBe('Gibsons');
  expect(findStationBySlug('atlantis')).toBeUndefined();
});

test('getDefaultStation is Victoria', () => expect(getDefaultStation().name).toBe('Victoria'));

test('getStationRegion uses region or looks it up by id', () => {
  expect(getStationRegion({ id: 'x', region: 'Howe Sound' })).toBe('Howe Sound');
  expect(getStationRegion({ id: '5cebf1df3d0f4a073c4bbd1e' })).toBe('Juan de Fuca Strait');
});

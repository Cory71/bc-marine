import { test, expect } from 'vitest';
import {
  ALL_LOCATIONS,
  toStationSlug,
  findStationBySlug,
  getDefaultStation,
  getStationRegion,
  BC_STATIONS,
  EC_FEED_CODES,
  getEcSubarea,
  noTidesMessage,
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

test('every location has a 24-character DFO station id, except offshore areas', () => {
  for (const location of ALL_LOCATIONS) {
    if (!location.offshore) expect(location.id).toMatch(/^[0-9a-f]{24}$/);
  }
});

test('no two tide stations share a DFO id', () => {
  const ids = BC_STATIONS.map(station => station.id);
  expect(new Set(ids).size).toBe(ids.length);
});

// Checked against EC's marine forecast area shapes (api.weather.gc.ca) on 2026-10-26
test('each place gets the EC forecast area it sits in', () => {
  const expected = {
    'Prince Rupert': 'Dixon Entrance East',
    Masset: 'Dixon Entrance West',
    'Langara Island': 'Dixon Entrance West',
    'Port Louis': 'West Coast Haida Gwaii',
    'Tasu Sound': 'West Coast Haida Gwaii',
    'Port Hardy': 'Queen Charlotte Strait',
    'Winter Harbour': 'Quatsino Sound',
    'Campbell River': 'Georgia Strait North',
    Ganges: 'Georgia Strait South',
    Kitimat: 'Douglas Channel',
    'Hartley Bay': 'Douglas Channel',
    Sidney: 'Haro Strait',
  };
  for (const [name, region] of Object.entries(expected)) {
    expect(findStationBySlug(toStationSlug(name))?.region, name).toBe(region);
  }
});

test('every place has an EC forecast feed', () => {
  for (const location of ALL_LOCATIONS) {
    expect(EC_FEED_CODES[location.region], location.name).toMatch(/^\d{5}$/);
  }
});

test('places on a split EC area get their own part of it', () => {
  const subareaOf = name => getEcSubarea(findStationBySlug(toStationSlug(name)));
  expect(subareaOf('Victoria')).toBe('east entrance');
  expect(subareaOf('Sooke')).toBe('central strait');
  expect(subareaOf('Port Renfrew')).toBe('west entrance');
  expect(subareaOf('Masset')).toBe('east of langara');
  expect(subareaOf('Sandspit')).toBe('northern half');
  expect(subareaOf('Port Louis')).toBe('northern half');
  expect(subareaOf('Tasu Sound')).toBe('southern half');
  expect(subareaOf('Comox')).toBe('north of nanaimo');
  expect(subareaOf('Tofino')).toBeUndefined();
});

test('offshore forecast areas have no tide station and say so', () => {
  const offshore = ALL_LOCATIONS.filter(location => location.offshore).map(
    location => location.region
  );
  expect(offshore.sort()).toEqual(['Bowie', 'Explorer', 'Queen Charlotte Sound']);
  expect(noTidesMessage({ offshore: true })).toMatch(/offshore/);
  expect(noTidesMessage(findStationBySlug('victoria'))).toBe(
    'No tide data available for this station.'
  );
});

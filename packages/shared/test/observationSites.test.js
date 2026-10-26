import { test, expect } from 'vitest';
import { OBSERVATION_SITES, BC_REGIONS } from '../src/index.js';

test('every site has a valid type and sits in BC waters', () => {
  for (const site of OBSERVATION_SITES) {
    expect(['lighthouse', 'buoy']).toContain(site.type);
    expect(site.lat).toBeGreaterThanOrEqual(47.5);
    expect(site.lat).toBeLessThanOrEqual(56);
    expect(site.lon).toBeGreaterThanOrEqual(-140);
    expect(site.lon).toBeLessThanOrEqual(-122.5);
  }
});

test('site ids and source ids are unique', () => {
  const ids = OBSERVATION_SITES.map(site => site.id);
  const sourceIds = OBSERVATION_SITES.map(site => site.sourceId);
  expect(new Set(ids).size).toBe(ids.length);
  expect(new Set(sourceIds).size).toBe(sourceIds.length);
});

test('the list has enough lighthouses and buoys to cover the coast', () => {
  const count = type => OBSERVATION_SITES.filter(site => site.type === type).length;
  expect(count('lighthouse')).toBeGreaterThanOrEqual(10);
  expect(count('buoy')).toBeGreaterThanOrEqual(8);
});

test('every site is tagged with the coast groups it reports for', () => {
  const coastNames = BC_REGIONS.map(region => region.name);
  for (const site of OBSERVATION_SITES) {
    expect(site.coasts.length).toBeGreaterThan(0);
    for (const coast of site.coasts) expect(coastNames).toContain(coast);
  }
});

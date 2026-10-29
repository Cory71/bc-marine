import { test, expect, vi, afterEach } from 'vitest';
import {
  readPlaceNames,
  searchPlaceNames,
  buildPlaceNameUrl,
  ALL_LOCATIONS,
} from '../src/index.js';

afterEach(() => vi.unstubAllGlobals());

// One BC Geographical Names result
function placeName(name, featureType, lat, lon) {
  return { properties: { name, featureType }, geometry: { coordinates: [lon, lat] } };
}

// Some of BC Geographical Names' results for "deep"
const DEEP_RESULTS = {
  features: [
    placeName('Deep Bay', 'Community', 49.462, -124.723), // Deep Bay near Bowser
    placeName('Deep Bay', 'Bay', 49.461, -124.744), // the bay right beside it
    placeName('Deep Bay', 'Bay', 59.658, -134.274), // far north, not on our coast
    placeName('Deep Creek', 'Creek (1)', 49.47, -124.72), // a creek, not a place on the water
  ],
};

test('a place name points to its nearest station, with the distance', () => {
  const [deepBay] = readPlaceNames(DEEP_RESULTS, ALL_LOCATIONS);
  expect(deepBay.name).toBe('Deep Bay');
  expect(deepBay.kind).toBe('Community');
  expect(deepBay.station.name).toBeTruthy();
  expect(deepBay.distanceKm).toBeLessThan(20);
});

test('places far from any station, creeks and repeats of the same spot are left out', () => {
  const results = readPlaceNames(DEEP_RESULTS, ALL_LOCATIONS);
  // The community and the bay beside it lead to the same station, so they count once
  expect(results.map(result => result.name)).toEqual(['Deep Bay']);
});

test('a name that is already a station is left to the station results', () => {
  const results = readPlaceNames(
    { features: [placeName('Comox', 'Town', 49.67, -124.93)] },
    ALL_LOCATIONS
  );
  expect(results).toEqual([]);
});

test('searchPlaceNames asks BC Geographical Names and returns coastal matches', async () => {
  const fetchMock = vi.fn(() => Promise.resolve(new Response(JSON.stringify(DEEP_RESULTS))));
  vi.stubGlobal('fetch', fetchMock);
  const results = await searchPlaceNames('deep b');
  expect(fetchMock.mock.calls[0][0]).toBe(buildPlaceNameUrl('deep b'));
  expect(results[0].name).toBe('Deep Bay');
});

test('the search URL asks for a name match in map coordinates', () => {
  const url = buildPlaceNameUrl('deep b');
  expect(url).toContain('https://apps.gov.bc.ca/pub/bcgnws/names/search?');
  expect(url).toContain('name=deep%20b');
  expect(url).toContain('outputSRS=4326');
});

test('place types are tidied for display', () => {
  const results = readPlaceNames(
    {
      features: [
        placeName('Ford Cove', 'Cove (2)', 49.497, -124.68),
        placeName('Qualicum', 'Indian Reserve-Réserve indienne', 49.4, -124.618),
      ],
    },
    ALL_LOCATIONS
  );
  expect(results.map(result => result.kind)).toEqual(['Cove', 'Indian Reserve']);
});

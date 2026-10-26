import { test, expect, vi, afterEach } from 'vitest';
import {
  selectNearbySites,
  fetchNearbyObservations,
  configureBuoyFeedUrl,
  buildDirectBuoyFeedUrl,
  fetchSiteHistory,
  findObservationSite,
} from '../src/services/observationService.js';

const VICTORIA = {
  name: 'Victoria',
  lat: 48.4244,
  lon: -123.3699,
  coast: 'Juan de Fuca & South Coast',
};

// Sites due north of Victoria: 0.09° of latitude is about 10 km
function site(name, type, kmNorth, sourceId, coasts = [VICTORIA.coast]) {
  return {
    id: name.toLowerCase(),
    name,
    type,
    lat: VICTORIA.lat + kmNorth * 0.009,
    lon: VICTORIA.lon,
    sourceId,
    coasts,
  };
}
const LIGHT_10 = site('Light10', 'lighthouse', 10, 'L10');
const LIGHT_20 = site('Light20', 'lighthouse', 20, 'L20');
const LIGHT_30 = site('Light30', 'lighthouse', 30, 'L30');
const BUOY_60 = site('Buoy60', 'buoy', 60, '46146');
const BUOY_150 = site('Buoy150', 'buoy', 150, '46206');

const GEOMET_BODY = JSON.stringify({
  features: [
    { properties: { obs_date_tm: '2026-10-25T23:23:00Z', avg_wnd_spd_10m_pst10mts: 32.2 } },
  ],
});
const NDBC_BODY =
  '#YY  MM DD hh mm WDIR WSPD GST  WVHT\n#yr  mo dy hr mn degT m/s  m/s     m\n2026 10 25 23 00 270  4.0  4.0   0.4\n';

// Fake fetch: GeoMet URLs get a lighthouse reading, everything else a NOAA file
function stubFetch({ failFor } = {}) {
  const fetchMock = vi.fn(url => {
    if (failFor && url.includes(failFor)) return Promise.reject(new Error('down'));
    const body = url.includes('api.weather.gc.ca') ? GEOMET_BODY : NDBC_BODY;
    return Promise.resolve(new Response(body));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  configureBuoyFeedUrl(buildDirectBuoyFeedUrl);
});

test('picks the 3 nearest, swapping in a buoy within 100 km for the third', () => {
  const chosen = selectNearbySites(VICTORIA, [LIGHT_30, BUOY_60, LIGHT_10, LIGHT_20]);
  expect(chosen.map(entry => entry.site.name)).toEqual(['Light10', 'Light20', 'Buoy60']);
  expect(chosen[0].distanceKm).toBeGreaterThan(9);
  expect(chosen[0].distanceKm).toBeLessThan(11);
});

test('keeps the 3 nearest lighthouses when the only buoy is beyond 100 km', () => {
  const chosen = selectNearbySites(VICTORIA, [LIGHT_10, LIGHT_20, LIGHT_30, BUOY_150]);
  expect(chosen.map(entry => entry.site.name)).toEqual(['Light10', 'Light20', 'Light30']);
});

test('returns nothing when no site is within 100 km', () => {
  const farStation = { name: 'Far', lat: 52, lon: -123.37, coast: VICTORIA.coast };
  expect(selectNearbySites(farStation, [LIGHT_10, BUOY_60])).toEqual([]);
});

test('a site whose fetch fails gets reading null; the others still load', async () => {
  stubFetch({ failFor: 'L20' });
  const station = { ...VICTORIA, lat: VICTORIA.lat + 0.0001 }; // unique cache key
  const results = await fetchNearbyObservations(station, [LIGHT_10, LIGHT_20, BUOY_60]);
  const byName = Object.fromEntries(results.map(r => [r.site.name, r.reading]));
  expect(byName.Light10.windKts).toBe(17);
  expect(byName.Light20).toBeNull();
  expect(byName.Buoy60.waveHeightFt).toBe(1.3);
});

test('buoy requests use the configured URL builder', async () => {
  const fetchMock = stubFetch();
  configureBuoyFeedUrl(id => `/api/buoy-feed?id=${id}`);
  const station = { ...VICTORIA, lat: VICTORIA.lat + 0.0002 };
  await fetchNearbyObservations(station, [BUOY_60]);
  expect(fetchMock.mock.calls.map(call => call[0])).toContain('/api/buoy-feed?id=46146');
});

test('no nearby sites resolves to an empty list without fetching', async () => {
  const fetchMock = stubFetch();
  expect(
    await fetchNearbyObservations({ name: 'Far', lat: 52, lon: -123.37, coast: VICTORIA.coast }, [
      LIGHT_10,
    ])
  ).toEqual([]);
  expect(fetchMock).not.toHaveBeenCalled();
});

test('a result with a failed site is not cached, so the next load tries again', async () => {
  const station = { ...VICTORIA, lat: VICTORIA.lat + 0.0003 };
  stubFetch({ failFor: 'L20' });
  await fetchNearbyObservations(station, [LIGHT_10, LIGHT_20]);
  vi.unstubAllGlobals();

  // Network is back: Light20 should now load instead of staying "no report"
  stubFetch();
  const results = await fetchNearbyObservations(station, [LIGHT_10, LIGHT_20]);
  expect(results.find(r => r.site.name === 'Light20').reading.windKts).toBe(17);
});

test('only picks sites that report for the same coast group as the station', () => {
  // Nearer, but on the other side of Vancouver Island
  const acrossTheIsland = site('Across', 'lighthouse', 5, 'X5', ['Strait of Georgia']);
  const sharedBoundary = site('Shared', 'lighthouse', 40, 'S40', [
    'Strait of Georgia',
    VICTORIA.coast,
  ]);
  const chosen = selectNearbySites(VICTORIA, [acrossTheIsland, LIGHT_10, sharedBoundary]);
  expect(chosen.map(entry => entry.site.name)).toEqual(['Light10', 'Shared']);
});

test('fetchSiteHistory asks EC for hourly lighthouse readings only', async () => {
  const fetchMock = stubFetch();
  const history = await fetchSiteHistory({ ...LIGHT_10, sourceId: 'HIST-L' });
  const url = new URL(fetchMock.mock.calls[0][0]);
  expect(url.searchParams.get('_is-minutely_obs-value')).toBe('false');
  expect(url.searchParams.get('limit')).toBe('12');
  expect(history[0].windKts).toBe(17);
});

test('fetchSiteHistory reads several hours from a NOAA buoy file', async () => {
  const twoHours =
    '#YY  MM DD hh mm WDIR WSPD GST  WVHT\n#yr  mo dy hr mn degT m/s  m/s     m\n' +
    '2026 10 25 23 00 270  4.0  4.0   0.4\n2026 10 25 22 00 250  5.0  6.0   0.5\n';
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(twoHours)))
  );
  const history = await fetchSiteHistory({ ...BUOY_60, sourceId: 'HIST-B' });
  expect(history.map(r => r.waveHeightFt)).toEqual([1.3, 1.6]);
});

test('findObservationSite looks a site up by its id', () => {
  expect(findObservationSite('race-rocks').name).toBe('Race Rocks');
  expect(findObservationSite('atlantis')).toBeUndefined();
});

test('an offshore area looks up to 300 km out, since no site is within 100 km', () => {
  const offshore = { ...VICTORIA, offshore: true };
  expect(selectNearbySites(offshore, [BUOY_150]).map(entry => entry.site.name)).toEqual([
    'Buoy150',
  ]);
});

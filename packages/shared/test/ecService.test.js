import { test, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isValidEcFeedCode,
  buildDirectEcFeedUrl,
  configureEcFeedUrl,
  parseMarineFeed,
  fetchMarineForecast,
  clearCache,
  tidyForecastText,
} from '../src/index.js';

// Small EC-style Atom feed: one warning and one forecast entry
const ATOM_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <title>Gale warning in effect - Howe Sound</title>
    <summary type="html">Gale warning in effect.</summary>
  </entry>
  <entry>
    <title>Marine Forecast - Howe Sound</title>
    <summary type="html">Wind light.&#60;br/&#62;Becoming &#60;b&#62;southeast&#60;/b&#62; 15 knots.</summary>
  </entry>
</feed>`;

// Same idea in RSS 2.0 format
const RSS_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <item><title>Strong wind warning in effect</title><description>Strong winds.</description></item>
  <item><title>Marine Forecast</title><description>Seas 1 metre.</description></item>
</channel></rss>`;

// One feed holding both Georgia Strait sub-areas
const GEORGIA_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry><title>Marine Forecast - Strait of Georgia - north of Nanaimo</title><summary>North text.</summary></entry>
  <entry><title>Marine Forecast - Strait of Georgia - south of Nanaimo</title><summary>South text.</summary></entry>
</feed>`;

beforeEach(() => clearCache('ec_Howe Sound'));
afterEach(() => {
  configureEcFeedUrl(buildDirectEcFeedUrl);
  vi.unstubAllGlobals();
});

test('isValidEcFeedCode accepts known codes only', () => {
  expect(isValidEcFeedCode('06400')).toBe(true);
  expect(isValidEcFeedCode('99999')).toBe(false);
  expect(isValidEcFeedCode('../etc')).toBe(false);
});

test('buildDirectEcFeedUrl points at weather.gc.ca', () =>
  expect(buildDirectEcFeedUrl('06400')).toBe('https://weather.gc.ca/rss/marine/06400_e.xml'));

test('parseMarineFeed reads Atom warnings and forecast', async () => {
  const { warnings, forecast } = await parseMarineFeed(ATOM_FIXTURE, 'Howe Sound');
  expect(warnings).toEqual([
    { title: 'Gale warning in effect - Howe Sound', summary: 'Gale warning in effect.' },
  ]);
  expect(forecast).toBe('Wind light.\nBecoming southeast 15 knots.');
});

test('parseMarineFeed reads RSS 2.0 items', async () => {
  const { warnings, forecast } = await parseMarineFeed(RSS_FIXTURE, 'Howe Sound');
  expect(warnings.map(w => w.title)).toEqual(['Strong wind warning in effect']);
  expect(forecast).toBe('Seas 1 metre.');
});

test('parseMarineFeed keeps only the Georgia Strait south entries', async () =>
  expect((await parseMarineFeed(GEORGIA_FIXTURE, 'Georgia Strait South')).forecast).toBe(
    'South text.'
  ));

// Juan de Fuca's feed holds three parts of the strait
const JUAN_DE_FUCA_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry><title>Forecast for Tonight. - Juan de Fuca Strait - east entrance</title><summary>East text.</summary></entry>
  <entry><title>Forecast for Tonight. - Juan de Fuca Strait - central strait</title><summary>Central text.</summary></entry>
  <entry><title>Forecast for Tonight. - Juan de Fuca Strait - west entrance</title><summary>West text.</summary></entry>
</feed>`;

// An offshore feed split into halves, with extended forecasts too
const BOWIE_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry><title>GALE WARNING IN EFFECT, Bowie - northern half</title><summary>Gale.</summary></entry>
  <entry><title>Forecast for Tonight and Monday. - Bowie - northern half</title><summary>North text.</summary></entry>
  <entry><title>Extended Forecast - Bowie - northern half</title><summary>Later north.</summary></entry>
  <entry><title>Forecast for Tonight and Monday. - Bowie - southern half</title><summary>South text.</summary></entry>
</feed>`;

test('parseMarineFeed can be given the part of the area to keep', async () =>
  expect(
    (await parseMarineFeed(JUAN_DE_FUCA_FIXTURE, 'Juan de Fuca Strait', 'west entrance')).forecast
  ).toBe('West text.'));

test('with no part chosen, a feed split into halves shows each half', async () => {
  const { forecast, warnings } = await parseMarineFeed(BOWIE_FIXTURE, 'Bowie');
  expect(forecast).toBe('Northern half: North text.\n\nSouthern half: South text.');
  expect(warnings.map(w => w.title)).toEqual(['GALE WARNING IN EFFECT, Bowie - northern half']);
});

// Dixon Entrance West, with a gale for the west-of-Langara part only
const DIXON_WEST_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry><title>Forecast for Tonight. - Dixon Entrance West - east of Langara</title><summary>East text.</summary></entry>
  <entry><title>GALE WARNING IN EFFECT, Dixon Entrance West - west of Langara</title><summary>Gale.</summary></entry>
  <entry><title>Forecast for Tonight. - Dixon Entrance West - west of Langara</title><summary>West text.</summary></entry>
</feed>`;

test('a place on the line between two parts gets warnings from both, but its own forecast', async () => {
  const parts = ['east of langara', 'west of langara'];
  const { forecast, warnings } = await parseMarineFeed(
    DIXON_WEST_FIXTURE,
    'Dixon Entrance West',
    'east of langara',
    parts
  );
  expect(forecast).toBe('East text.');
  expect(warnings.map(w => w.title)).toEqual([
    'GALE WARNING IN EFFECT, Dixon Entrance West - west of Langara',
  ]);
});

test('a place inside one part gets warnings for that part only', async () => {
  const { warnings } = await parseMarineFeed(
    DIXON_WEST_FIXTURE,
    'Dixon Entrance West',
    'east of langara'
  );
  expect(warnings).toEqual([]);
});

test('fetchMarineForecast uses the configured URL builder', async () => {
  configureEcFeedUrl(code => `/api/ec-feed?code=${code}`);
  const fetchMock = vi.fn(() => Promise.resolve(new Response(ATOM_FIXTURE)));
  vi.stubGlobal('fetch', fetchMock);
  const { forecast } = await fetchMarineForecast('Howe Sound');
  expect(fetchMock.mock.calls[0][0]).toBe('/api/ec-feed?code=06400');
  expect(forecast).toContain('southeast 15 knots');
});

test('unknown region returns the existing fallback', async () => {
  expect(await fetchMarineForecast('Nowhere')).toEqual({
    warnings: [],
    forecast: 'No forecast available for this region.',
  });
});

test('tidyForecastText keeps the blank line between halves of an offshore forecast', () =>
  expect(
    tidyForecastText('Northern half: Wind\nnorth 20.\nIssued 9 PM\n\nSouthern half: Calm.')
  ).toBe('Northern half: Wind north 20.\nIssued 9 PM\n\nSouthern half: Calm.'));

test('tidyForecastText joins mid-sentence breaks but keeps "Issued" on its own line', () =>
  expect(tidyForecastText('Wind light near noon and\nto southeast 20.\nIssued 10:30 AM PDT')).toBe(
    'Wind light near noon and to southeast 20.\nIssued 10:30 AM PDT'
  ));

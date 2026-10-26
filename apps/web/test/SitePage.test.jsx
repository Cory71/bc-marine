import { test, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { fetchSiteHistory, DEFAULT_UNITS } from '@bc-marine/shared';
import { useApp } from '../src/context/AppContext.jsx';
import { reloadSavedSites } from '../src/context/useSavedSites.js';
import SitePage from '../src/pages/SitePage.jsx';
import { RACE_ROCKS, HALIBUT_BANK, VICTORIA, minutesAgo } from './observations.fixtures.js';

// Keep the real shared helpers (site list, formatters) but fake the network call
vi.mock('@bc-marine/shared', async importOriginal => ({
  ...(await importOriginal()),
  fetchSiteHistory: vi.fn(),
}));
vi.mock('../src/context/AppContext.jsx', () => ({ useApp: vi.fn() }));
afterEach(cleanup);

// Each test starts with nothing saved
beforeEach(() => {
  localStorage.clear();
  reloadSavedSites();
});

function renderSite(siteId, units = DEFAULT_UNITS) {
  useApp.mockReturnValue({ activeStation: { ...VICTORIA, lat: 48.4244, lon: -123.3699 }, units });
  render(
    <MemoryRouter initialEntries={[`/observations/${siteId}?station=victoria`]}>
      <Routes>
        <Route path="/observations/:siteId" element={<SitePage />} />
      </Routes>
    </MemoryRouter>
  );
}

const EARLIER = { ...RACE_ROCKS.reading, observedAt: minutesAgo(61), windKts: 14, gustKts: 19 };

test('shows the latest reading and an hourly table for the site', async () => {
  fetchSiteHistory.mockResolvedValue([RACE_ROCKS.reading, EARLIER]);
  renderSite('race-rocks');
  expect(await screen.findByRole('heading', { name: 'Race Rocks' })).toBeTruthy();
  const rows = await screen.findAllByRole('row');
  expect(rows).toHaveLength(3); // header + 2 hours
  expect(rows[2].textContent).toContain('E 14 kts');
  expect(rows[2].textContent).toContain('19 kts');
  expect(screen.getByRole('link', { name: /back to observations/i }).getAttribute('href')).toBe(
    '/observations?station=victoria'
  );
});

test('says so when the site has no recent readings', async () => {
  fetchSiteHistory.mockResolvedValue([]);
  renderSite('race-rocks');
  await waitFor(() => expect(screen.getByText('No recent reports from this site.')).toBeTruthy());
});

// ---------- Charts ----------

test('draws a wind chart of the last 12 hours, in the chosen units', async () => {
  fetchSiteHistory.mockResolvedValue([RACE_ROCKS.reading, EARLIER]);
  renderSite('race-rocks', { ...DEFAULT_UNITS, speed: 'kmh' });
  const chart = await screen.findByRole('img', { name: /^Wind over the last 12 hours/ });
  expect(chart.getAttribute('aria-label')).toContain('km/h');
  expect(chart.innerHTML).not.toContain('NaN');
  // Lighthouses have no wave readings, so there's no wave chart
  expect(screen.queryByRole('img', { name: /^Wave height/ })).toBeNull();
});

test('buoys also get a wave-height chart', async () => {
  const later = { ...HALIBUT_BANK.reading, observedAt: minutesAgo(100), waveHeightFt: 2 };
  fetchSiteHistory.mockResolvedValue([HALIBUT_BANK.reading, later]);
  renderSite('halibut-bank');
  expect(
    await screen.findByRole('img', { name: /^Wave height over the last 12 hours/ })
  ).toBeTruthy();
});

test('a single reading shows a short note instead of charts', async () => {
  fetchSiteHistory.mockResolvedValue([RACE_ROCKS.reading]);
  renderSite('race-rocks');
  expect(await screen.findByText('Not enough readings yet to chart.')).toBeTruthy();
  expect(screen.queryByRole('img', { name: /over the last 12 hours/ })).toBeNull();
});

// ---------- Saving ----------

test('the save button stars the site and remembers it on this device', async () => {
  fetchSiteHistory.mockResolvedValue([RACE_ROCKS.reading]);
  renderSite('race-rocks');
  const saveButton = await screen.findByRole('button', { name: 'Save Race Rocks' });
  expect(saveButton.getAttribute('aria-pressed')).toBe('false');

  fireEvent.click(saveButton);
  expect(saveButton.getAttribute('aria-pressed')).toBe('true');
  expect(JSON.parse(localStorage.getItem('savedSites'))).toEqual(['race-rocks']);

  fireEvent.click(saveButton);
  expect(saveButton.getAttribute('aria-pressed')).toBe('false');
  expect(JSON.parse(localStorage.getItem('savedSites'))).toEqual([]);
});

test('an unknown site shows a not-found message instead of crashing', () => {
  renderSite('atlantis');
  expect(screen.getByText("We couldn't find that lighthouse or buoy.")).toBeTruthy();
});

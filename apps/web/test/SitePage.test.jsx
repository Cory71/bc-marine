import { test, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { fetchSiteHistory } from '@bc-marine/shared';
import { useApp } from '../src/context/AppContext.jsx';
import SitePage from '../src/pages/SitePage.jsx';
import { RACE_ROCKS, VICTORIA, minutesAgo } from './observations.fixtures.js';

// Keep the real shared helpers (site list, formatters) but fake the network call
vi.mock('@bc-marine/shared', async importOriginal => ({
  ...(await importOriginal()),
  fetchSiteHistory: vi.fn(),
}));
vi.mock('../src/context/AppContext.jsx', () => ({ useApp: vi.fn() }));
afterEach(cleanup);

function renderSite(siteId) {
  useApp.mockReturnValue({ activeStation: { ...VICTORIA, lat: 48.4244, lon: -123.3699 } });
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

test('an unknown site shows a not-found message instead of crashing', () => {
  renderSite('atlantis');
  expect(screen.getByText("We couldn't find that lighthouse or buoy.")).toBeTruthy();
});

import { test, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { useApp } from '../src/context/AppContext.jsx';
import ObservationsPage from '../src/pages/ObservationsPage.jsx';
import {
  RACE_ROCKS,
  HALIBUT_BANK,
  SILENT_SITE,
  VICTORIA,
  minutesAgo,
} from './observations.fixtures.js';

vi.mock('../src/context/AppContext.jsx', () => ({ useApp: vi.fn() }));
afterEach(cleanup);

function renderPage(observations) {
  useApp.mockReturnValue({
    activeStation: VICTORIA,
    observations,
    getSourceStatus: () => 'ready',
    loading: false,
    lastUpdated: new Date(),
  });
  render(
    <MemoryRouter initialEntries={['/observations?station=victoria']}>
      <ObservationsPage />
    </MemoryRouter>
  );
}

// The tile (an <article>) for one site
function tileFor(name) {
  return screen.getByRole('heading', { name }).closest('article');
}

test('a lighthouse tile shows wind, gust, pressure and air, but no waves', () => {
  renderPage([RACE_ROCKS]);
  const tile = within(tileFor('Race Rocks'));
  expect(tile.getByText('E 17 kts')).toBeTruthy();
  expect(tile.getByText('25 kts')).toBeTruthy();
  expect(tile.getByText('1007.5 hPa')).toBeTruthy();
  expect(tile.getByText('11.3 °C')).toBeTruthy();
  expect(tile.queryByText('Waves')).toBeNull();
});

test('a buoy tile shows waves and wave period', () => {
  renderPage([HALIBUT_BANK]);
  const tile = within(tileFor('Halibut Bank'));
  expect(tile.getByText('1.3 ft')).toBeTruthy();
  expect(tile.getByText('4 s')).toBeTruthy();
  expect(tile.getByText('11.1 °C')).toBeTruthy();
});

test('a site without a reading says so', () => {
  renderPage([SILENT_SITE]);
  expect(within(tileFor('Kelp Reefs')).getByText('No recent report')).toBeTruthy();
});

test('a reading older than 3 hours is labelled as old', () => {
  const stale = {
    ...RACE_ROCKS,
    reading: { ...RACE_ROCKS.reading, observedAt: minutesAgo(4 * 60) },
  };
  renderPage([stale]);
  expect(within(tileFor('Race Rocks')).getByText('Old reading')).toBeTruthy();
});

test('no nearby sites shows an empty state', () => {
  renderPage([]);
  expect(screen.getByText('No observation sites nearby.')).toBeTruthy();
});

test('each tile links to that site page, keeping the station', () => {
  renderPage([RACE_ROCKS]);
  const link = screen.getByRole('link', { name: /race rocks/i });
  expect(link.getAttribute('href')).toBe('/observations/race-rocks?station=victoria');
});

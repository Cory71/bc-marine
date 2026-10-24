import { test, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { useApp } from '../src/context/AppContext.jsx';
import CurrentsPage from '../src/pages/CurrentsPage.jsx';

// Feed the page fake app data instead of the real provider
vi.mock('../src/context/AppContext.jsx', () => ({ useApp: vi.fn() }));

afterEach(cleanup);

const GOLD_RIVER = { name: 'Gold River', region: 'Nootka Sound', coast: 'West Coast Vancouver Island' };

// Hourly readings starting now, with the given current speeds
function hoursWithSpeeds(speeds) {
  return speeds.map((currentSpeedKts, i) => ({
    time: new Date(Date.now() + i * 3600000),
    currentSpeedKts,
    currentDirectionDeg: currentSpeedKts == null ? null : 90,
  }));
}

function renderPage(weather) {
  useApp.mockReturnValue({ activeStation: GOLD_RIVER, weather, failures: [], loading: false, lastUpdated: new Date() });
  render(
    <MemoryRouter initialEntries={['/currents?station=gold-river']}>
      <CurrentsPage />
    </MemoryRouter>
  );
}

test('CurrentsPage shows the fallback message when there is no current data', () => {
  renderPage(hoursWithSpeeds([null, null, null]));
  expect(screen.getByText('No tidal current data available for this station.')).toBeTruthy();
  expect(screen.queryByText(/NaN/)).toBeNull();
});

test('CurrentsPage shows speed, direction and an hourly table when data exists', () => {
  renderPage(hoursWithSpeeds([0.4, 0.6, 0.5]));
  expect(screen.getByRole('table')).toBeTruthy();
  expect(screen.getAllByText('0.4 kts').length).toBeGreaterThan(0);
  expect(screen.getByRole('link', { name: /back to dashboard/i }).getAttribute('href')).toBe(
    '/?station=gold-river'
  );
});

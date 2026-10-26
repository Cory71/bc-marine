import { test, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { DEFAULT_UNITS, findStationBySlug } from '@bc-marine/shared';
import { useApp } from '../src/context/AppContext.jsx';
import DashboardPage from '../src/pages/DashboardPage.jsx';

// Feed the page fake app data instead of the real provider
vi.mock('../src/context/AppContext.jsx', () => ({ useApp: vi.fn() }));

afterEach(cleanup);

function renderDashboard(station) {
  useApp.mockReturnValue({
    activeStation: station,
    tides: [],
    tideEvents: [],
    weather: [],
    observations: [],
    marineForecast: { warnings: [], forecast: 'Wind north 20 knots.' },
    units: DEFAULT_UNITS,
    getSourceStatus: () => 'ready',
    loading: false,
    lastUpdated: new Date(),
  });
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  );
}

test('an offshore area says it has no tide station and drops the tide chart', () => {
  renderDashboard(findStationBySlug('bowie-offshore'));
  expect(screen.getByText(/No tide station out here/)).toBeTruthy();
  expect(screen.queryByText("Today's tide")).toBeNull();
});

test('a coastal station still shows the tide card and chart', () => {
  renderDashboard(findStationBySlug('victoria'));
  expect(screen.queryByText(/No tide station out here/)).toBeNull();
  expect(screen.getByText("Today's tide")).toBeTruthy();
});

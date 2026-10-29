import { test, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { DEFAULT_UNITS, findStationBySlug, searchPlaceNames } from '@bc-marine/shared';
import { useApp } from '../src/context/AppContext.jsx';
import Sidebar from '../src/layout/Sidebar.jsx';
import { VICTORIA } from './observations.fixtures.js';

// Keep the real shared helpers, but answer place-name searches without the network
vi.mock('@bc-marine/shared', async importOriginal => ({
  ...(await importOriginal()),
  searchPlaceNames: vi.fn(),
}));
vi.mock('../src/context/AppContext.jsx', () => ({ useApp: vi.fn() }));
afterEach(cleanup);

const HORNBY = findStationBySlug('hornby-island');

function renderSidebar() {
  const setActiveStationBySlug = vi.fn();
  useApp.mockReturnValue({
    activeStation: VICTORIA,
    setActiveStationBySlug,
    saveStation: vi.fn(),
    savedStations: [],
    removeStation: vi.fn(),
    units: DEFAULT_UNITS,
    setUnit: vi.fn(),
  });
  render(
    <MemoryRouter initialEntries={['/?station=victoria']}>
      <Sidebar open={false} onClose={vi.fn()} />
    </MemoryRouter>
  );
  return { setActiveStationBySlug };
}

test('other BC place names show their nearest station, and picking one opens it', async () => {
  searchPlaceNames.mockResolvedValue([
    { name: 'Deep Bay', kind: 'Community', station: HORNBY, distanceKm: 5.1 },
  ]);
  const { setActiveStationBySlug } = renderSidebar();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'deep bay' } });

  const place = await screen.findByRole('button', { name: /Deep Bay/ });
  expect(place.textContent).toContain('Hornby Island');
  expect(place.textContent).toContain('5 km');
  expect(searchPlaceNames).toHaveBeenCalledWith('deep bay');

  fireEvent.click(place);
  expect(setActiveStationBySlug).toHaveBeenCalledWith('hornby-island');
});

test('short searches do not ask for place names', async () => {
  searchPlaceNames.mockClear();
  renderSidebar();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'de' } });
  await new Promise(resolve => setTimeout(resolve, 500));
  expect(searchPlaceNames).not.toHaveBeenCalled();
});

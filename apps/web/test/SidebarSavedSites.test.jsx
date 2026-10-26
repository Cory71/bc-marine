import { test, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { DEFAULT_UNITS } from '@bc-marine/shared';
import { useApp } from '../src/context/AppContext.jsx';
import { reloadSavedSites } from '../src/context/useSavedSites.js';
import Sidebar from '../src/layout/Sidebar.jsx';
import { VICTORIA } from './observations.fixtures.js';

vi.mock('../src/context/AppContext.jsx', () => ({ useApp: vi.fn() }));
afterEach(cleanup);

beforeEach(() => {
  localStorage.clear();
  useApp.mockReturnValue({
    activeStation: VICTORIA,
    setActiveStationBySlug: vi.fn(),
    saveStation: vi.fn(),
    savedStations: [],
    removeStation: vi.fn(),
    units: DEFAULT_UNITS,
    setUnit: vi.fn(),
  });
});

function renderSidebar(savedSiteIds) {
  localStorage.setItem('savedSites', JSON.stringify(savedSiteIds));
  reloadSavedSites();
  render(
    <MemoryRouter initialEntries={['/?station=victoria']}>
      <Sidebar open={false} onClose={vi.fn()} />
    </MemoryRouter>
  );
}

test('lists saved lighthouses and buoys, linking to their pages', () => {
  renderSidebar(['race-rocks', 'halibut-bank']);
  const section = screen.getByRole('region', { name: 'Saved lighthouses & buoys' });
  const links = section.querySelectorAll('a');
  expect(links).toHaveLength(2);
  expect(links[0].getAttribute('href')).toBe('/observations/race-rocks?station=victoria');
  expect(links[1].textContent).toContain('Buoy');
});

test('a saved site can be removed from the list', () => {
  renderSidebar(['race-rocks', 'halibut-bank']);
  fireEvent.click(screen.getByRole('button', { name: 'Remove Race Rocks' }));
  expect(screen.queryByRole('link', { name: /race rocks/i })).toBeNull();
  expect(JSON.parse(localStorage.getItem('savedSites'))).toEqual(['halibut-bank']);
});

test('the list is hidden when nothing is saved, and unknown ids are ignored', () => {
  renderSidebar(['atlantis']);
  expect(screen.queryByRole('region', { name: 'Saved lighthouses & buoys' })).toBeNull();
});

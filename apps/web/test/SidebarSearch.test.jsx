import { test, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { useApp } from '../src/context/AppContext.jsx';
import Sidebar from '../src/layout/Sidebar.jsx';
import { VICTORIA } from './observations.fixtures.js';

vi.mock('../src/context/AppContext.jsx', () => ({ useApp: vi.fn() }));
afterEach(cleanup);

test('search also finds lighthouses and buoys, linking to their pages', () => {
  const onClose = vi.fn();
  useApp.mockReturnValue({
    activeStation: VICTORIA,
    setActiveStationBySlug: vi.fn(),
    saveStation: vi.fn(),
    savedStations: [],
    removeStation: vi.fn(),
  });
  render(
    <MemoryRouter initialEntries={['/?station=victoria']}>
      <Sidebar open={false} onClose={onClose} />
    </MemoryRouter>
  );
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'halibut' } });
  const link = screen.getByRole('link', { name: /halibut bank/i });
  expect(link.getAttribute('href')).toBe('/observations/halibut-bank?station=victoria');
  expect(link.textContent).toContain('Buoy');

  // Picking one closes the drawer and clears the search, like picking a station
  fireEvent.click(link);
  expect(onClose).toHaveBeenCalled();
  expect(screen.getByRole('searchbox').value).toBe('');
});

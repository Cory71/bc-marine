import { test, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { DEFAULT_UNITS } from '@bc-marine/shared';
import { useApp } from '../src/context/AppContext.jsx';
import Sidebar from '../src/layout/Sidebar.jsx';
import { VICTORIA } from './observations.fixtures.js';

vi.mock('../src/context/AppContext.jsx', () => ({ useApp: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// Render the sidebar with a device that reports the given position
function renderWithPosition(coords) {
  const setActiveStationBySlug = vi.fn();
  const getCurrentPosition = vi.fn(success => success({ coords }));
  vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });
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
  fireEvent.click(screen.getByRole('button', { name: /use my location/i }));
  return { setActiveStationBySlug, getCurrentPosition };
}

test('a precise location goes straight to the nearest station', () => {
  const { setActiveStationBySlug, getCurrentPosition } = renderWithPosition({
    latitude: 49.1659,
    longitude: -123.9401,
    accuracy: 30,
  });
  expect(setActiveStationBySlug).toHaveBeenCalledWith('nanaimo');
  expect(getCurrentPosition.mock.calls[0][2]).toMatchObject({ enableHighAccuracy: true });
});

test('a rough location shows the guess and waits instead of jumping there', () => {
  const { setActiveStationBySlug } = renderWithPosition({
    latitude: 49.0253,
    longitude: -122.8028,
    accuracy: 40000,
  });
  expect(setActiveStationBySlug).not.toHaveBeenCalled();
  expect(screen.getByText(/only place you within about 40 km/)).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Use White Rock' }));
  expect(setActiveStationBySlug).toHaveBeenCalledWith('white-rock');
});

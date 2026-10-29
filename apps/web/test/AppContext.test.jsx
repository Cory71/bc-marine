import { test, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { loadStationData, findStationBySlug } from '@bc-marine/shared';
import { AppProvider, useApp } from '../src/context/AppContext.jsx';

// Keep the real shared helpers, but don't hit the network
vi.mock('@bc-marine/shared', async importOriginal => ({
  ...(await importOriginal()),
  loadStationData: vi.fn(),
}));

const MOCK_TIDES = [{ time: new Date(), heightFt: 5 }];

beforeEach(() => {
  window.localStorage.clear();
  loadStationData.mockResolvedValue({
    tides: MOCK_TIDES,
    tideEvents: [],
    weeklyTides: [],
    weather: [],
    marineForecast: { warnings: [], forecast: 'Calm' },
    failures: [],
  });
});

// Render useApp() inside the router + provider, and expose the current URL too
function renderApp(initialUrl = '/') {
  const wrapper = ({ children }) => (
    <MemoryRouter initialEntries={[initialUrl]}>
      <AppProvider>{children}</AppProvider>
    </MemoryRouter>
  );
  return renderHook(() => ({ app: useApp(), location: useLocation() }), { wrapper });
}

test('unknown ?station= falls back to Victoria and is removed from the address', async () => {
  const { result } = renderApp('/?station=atlantis');
  expect(result.current.app.activeStation.name).toBe('Victoria');
  await waitFor(() => expect(result.current.location.search).toBe(''));
});

test('a known ?station= picks that station', async () => {
  const { result } = renderApp('/tides?station=tofino');
  expect(result.current.app.activeStation.name).toBe('Tofino');
  await waitFor(() => expect(result.current.app.loading).toBe(false));
});

test('setActiveStationBySlug updates the URL', async () => {
  const { result } = renderApp('/?station=victoria');
  act(() => result.current.app.setActiveStationBySlug('sidney'));
  await waitFor(() => expect(result.current.location.search).toBe('?station=sidney'));
  expect(result.current.app.activeStation.name).toBe('Sidney');
});

test('two stations sharing a DFO id can both be saved', async () => {
  const { result } = renderApp();
  act(() => result.current.app.saveStation(findStationBySlug('ucluelet')));
  act(() => result.current.app.saveStation(findStationBySlug('tofino')));
  const names = result.current.app.savedStations.map(s => s.name);
  expect(names).toEqual(['Victoria', 'Ucluelet', 'Tofino']);
  expect(result.current.app.isSaved('tofino')).toBe(true);
  act(() => result.current.app.removeStation('ucluelet'));
  expect(result.current.app.savedStations.map(s => s.name)).toEqual(['Victoria', 'Tofino']);
});

test('a failed source keeps the other data and is listed in failures', async () => {
  loadStationData.mockResolvedValue({
    tides: MOCK_TIDES,
    tideEvents: [],
    weeklyTides: [],
    weather: [],
    marineForecast: null,
    failures: ['marineForecast'],
  });
  const { result } = renderApp('/?station=victoria');
  await waitFor(() => expect(result.current.app.loading).toBe(false));
  expect(result.current.app.tides).toEqual(MOCK_TIDES);
  expect(result.current.app.marineForecast).toEqual({ warnings: [], forecast: '' });
  expect(result.current.app.failures).toEqual(['marineForecast']);
});

test('choosing a unit updates the app and is remembered on this device', async () => {
  const { result } = renderApp('/?station=victoria');
  expect(result.current.app.units.height).toBe('ft');
  act(() => result.current.app.setUnit('height', 'm'));
  expect(result.current.app.units.height).toBe('m');
  expect(JSON.parse(window.localStorage.getItem('units')).height).toBe('m');
});

test('with no ?station=, the saved opening station opens and the address stays plain', async () => {
  window.localStorage.setItem('openingStation', 'tofino');
  const { result } = renderApp('/');
  expect(result.current.app.activeStation.name).toBe('Tofino');
  // A bookmark made now saves the plain address, so it keeps following the setting
  await new Promise(resolve => setTimeout(resolve, 50));
  expect(result.current.location.search).toBe('');
});

test('picking the opening station from the list takes the station out of the address', async () => {
  window.localStorage.setItem('openingStation', 'tofino');
  const { result } = renderApp('/?station=sidney');
  act(() => result.current.app.setActiveStationBySlug('tofino'));
  await waitFor(() => expect(result.current.location.search).toBe(''));
  expect(result.current.app.activeStation.name).toBe('Tofino');
});

test('a shared ?station= link still wins over the opening station', () => {
  window.localStorage.setItem('openingStation', 'tofino');
  const { result } = renderApp('/?station=sidney');
  expect(result.current.app.activeStation.name).toBe('Sidney');
});

test('an unknown saved opening station falls back to Victoria', () => {
  window.localStorage.setItem('openingStation', 'atlantis');
  const { result } = renderApp('/');
  expect(result.current.app.activeStation.name).toBe('Victoria');
});

test('setOpeningStation remembers the station for next time', () => {
  const { result } = renderApp('/');
  expect(result.current.app.openingStation.name).toBe('Victoria');
  act(() => result.current.app.setOpeningStation(findStationBySlug('sidney')));
  expect(result.current.app.openingStation.name).toBe('Sidney');
  expect(window.localStorage.getItem('openingStation')).toBe('sidney');
});

test('the theme follows the device until one is chosen, then is remembered', () => {
  const { result } = renderApp('/');
  expect(result.current.app.theme).toBe('device');
  expect(document.documentElement.dataset.theme).toBeUndefined();

  act(() => result.current.app.setTheme('light'));
  expect(document.documentElement.dataset.theme).toBe('light');
  expect(window.localStorage.getItem('theme')).toBe('light');

  act(() => result.current.app.setTheme('device'));
  expect(document.documentElement.dataset.theme).toBeUndefined();
});

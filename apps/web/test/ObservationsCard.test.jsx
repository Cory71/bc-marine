import { test, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { useApp } from '../src/context/AppContext.jsx';
import NearbyObservationsCard from '../src/components/NearbyObservationsCard.jsx';
import { RACE_ROCKS, HALIBUT_BANK, SILENT_SITE, VICTORIA } from './observations.fixtures.js';

vi.mock('../src/context/AppContext.jsx', () => ({ useApp: vi.fn() }));
afterEach(cleanup);

function renderCard(observations) {
  useApp.mockReturnValue({ activeStation: VICTORIA, observations, getSourceStatus: () => 'ready' });
  render(
    <MemoryRouter initialEntries={['/?station=victoria']}>
      <NearbyObservationsCard />
    </MemoryRouter>
  );
}

test('shows one short line per site and links to the Observations page', () => {
  renderCard([RACE_ROCKS, HALIBUT_BANK, SILENT_SITE]);
  const card = screen.getByRole('link');
  expect(card.getAttribute('href')).toBe('/observations?station=victoria');
  expect(card.textContent).toContain('Race Rocks');
  expect(card.textContent).toContain('E 17 kts, gust 25');
  expect(card.textContent).toContain('1 min ago');
  expect(card.textContent).toContain('W 8 kts, waves 1.3 ft');
  expect(card.textContent).toContain('No recent report');
});

test('says so when no site is nearby', () => {
  renderCard([]);
  expect(screen.getByText('No observation sites nearby.')).toBeTruthy();
});

import { test, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { useApp } from '../src/context/AppContext.jsx';
import NearbyObservationsCard from '../src/components/NearbyObservationsCard.jsx';
import {
  RACE_ROCKS,
  HALIBUT_BANK,
  SILENT_SITE,
  VICTORIA,
  minutesAgo,
} from './observations.fixtures.js';

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

test('shows each site with its type, a big wind value, gust or waves, and age', () => {
  renderCard([RACE_ROCKS, HALIBUT_BANK, SILENT_SITE]);
  const card = screen.getByRole('link');
  expect(card.getAttribute('href')).toBe('/observations?station=victoria');

  const raceRocks = screen.getByText('Race Rocks').closest('li');
  expect(raceRocks.textContent).toContain('Lighthouse');
  expect(raceRocks.querySelector('.obs-lines__wind').textContent).toBe('E 17 kts');
  expect(raceRocks.textContent).toContain('gust 25 kts');
  expect(raceRocks.textContent).toContain('1 min ago');

  const halibutBank = screen.getByText('Halibut Bank').closest('li');
  expect(halibutBank.textContent).toContain('Buoy');
  expect(halibutBank.querySelector('.obs-lines__wind').textContent).toBe('W 8 kts');
  expect(halibutBank.textContent).toContain('waves 1.3 ft');
  expect(halibutBank.textContent).toContain('gust');

  expect(screen.getByText('Kelp Reefs').closest('li').textContent).toContain('No recent report');
});

test('says so when no site is nearby', () => {
  renderCard([]);
  expect(screen.getByText('No observation sites nearby.')).toBeTruthy();
});

test('an old reading is labelled on the card, not shown as if it were current', () => {
  const stale = {
    ...RACE_ROCKS,
    reading: { ...RACE_ROCKS.reading, observedAt: minutesAgo(100 * 60) },
  };
  renderCard([stale]);
  const row = screen.getByText('Race Rocks').closest('li');
  expect(row.className).toContain('obs-lines__row--old');
  expect(row.textContent).toContain('Old reading');
  expect(row.textContent).toContain('4 d ago');
});

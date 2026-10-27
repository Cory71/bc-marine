import { test, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import TideCurve from '../src/components/TideCurve.jsx';

afterEach(cleanup);

const NOW = new Date('2026-10-24T17:20:00Z');

// Six hourly readings from 14:00 to 19:00 UTC
const SIX_HOURLY_POINTS = [2, 3, 5, 6, 5, 3].map((heightFt, i) => ({
  time: new Date(Date.UTC(2026, 9, 24, 14 + i)),
  heightFt,
}));

const EVENTS = [
  { time: new Date('2026-10-24T17:30:00Z'), heightFt: 6.2, type: 'HIGH' },
  { time: new Date('2026-10-24T23:45:00Z'), heightFt: 1.1, type: 'LOW' },
];

test('TideCurve renders an accessible svg and a Now marker', () => {
  render(<TideCurve tides={SIX_HOURLY_POINTS} now={NOW} width={600} />);
  expect(screen.getByRole('img', { name: /tide/i })).toBeTruthy();
  expect(screen.getByText('Now')).toBeTruthy();
});

test('TideCurve label summarises the next high and low', () => {
  render(<TideCurve tides={SIX_HOURLY_POINTS} events={EVENTS} now={NOW} width={600} />);
  const label = screen.getByRole('img').getAttribute('aria-label');
  expect(label).toBe(
    'Tide curve for today. Next high 6.2 ft at 10:30 AM, next low 1.1 ft at 4:45 PM.'
  );
});

test('TideCurve renders nothing with fewer than 2 points', () => {
  const { container } = render(<TideCurve tides={[]} />);
  expect(container.firstChild).toBeNull();
});

test('the Now label moves below its dot when a high tide is close by', () => {
  // NOW is 10 minutes before the 10:30 AM high, so their labels would overlap
  const { container } = render(
    <TideCurve tides={SIX_HOURLY_POINTS} events={EVENTS} now={NOW} width={600} />
  );
  const nowGroup = container.querySelector('.tide-curve__now');
  const dotY = Number(nowGroup.querySelector('circle').getAttribute('cy'));
  const labelY = Number(nowGroup.querySelector('text').getAttribute('y'));
  expect(labelY).toBeGreaterThanOrEqual(dotY + 12);
});

test('on a narrow phone chart, the Now label avoids the closest high, not an earlier low', () => {
  // Comox, 27 Oct: low 12:44 AM, high 7:45 AM, viewed at 7:44 AM on a phone-width chart
  const day = Array.from({ length: 24 }, (_, hour) => ({
    time: new Date(Date.UTC(2026, 9, 27, 7 + hour)),
    heightFt: 9 + 7 * Math.sin(((hour - 1) / 12.4) * 2 * Math.PI - Math.PI / 2),
  }));
  const events = [
    { time: new Date('2026-10-27T07:44:00Z'), heightFt: 2.4, type: 'LOW' },
    { time: new Date('2026-10-27T14:45:00Z'), heightFt: 16, type: 'HIGH' },
  ];
  const { container } = render(
    <TideCurve tides={day} events={events} now={new Date('2026-10-27T14:44:00Z')} width={290} />
  );
  const nowGroup = container.querySelector('.tide-curve__now');
  const dotY = Number(nowGroup.querySelector('circle').getAttribute('cy'));
  const labelY = Number(nowGroup.querySelector('text').getAttribute('y'));
  expect(labelY).toBeGreaterThanOrEqual(dotY + 12);
});

import { test, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { DEFAULT_UNITS } from '@bc-marine/shared';
import { useApp } from '../src/context/AppContext.jsx';
import UnitsPicker from '../src/components/UnitsPicker.jsx';

vi.mock('../src/context/AppContext.jsx', () => ({ useApp: vi.fn() }));
afterEach(cleanup);

test('shows the current choice for each kind and changes it on click', () => {
  const setUnit = vi.fn();
  useApp.mockReturnValue({ units: DEFAULT_UNITS, setUnit });
  render(<UnitsPicker />);

  const speedGroup = screen.getByRole('group', { name: 'Speed' });
  expect(speedGroup.querySelector('[aria-pressed="true"]').textContent).toBe('kts');

  fireEvent.click(screen.getByRole('button', { name: 'm' }));
  expect(setUnit).toHaveBeenCalledWith('height', 'm');
});

test('offers pressure units', () => {
  useApp.mockReturnValue({ units: DEFAULT_UNITS, setUnit: vi.fn() });
  render(<UnitsPicker />);
  const pressureGroup = screen.getByRole('group', { name: 'Pressure' });
  expect(pressureGroup.querySelector('[aria-pressed="true"]').textContent).toBe('hPa (mb)');
});

test('offers 12-hour and 24-hour time', () => {
  useApp.mockReturnValue({ units: DEFAULT_UNITS, setUnit: vi.fn() });
  render(<UnitsPicker />);
  const timeGroup = screen.getByRole('group', { name: 'Time' });
  expect(timeGroup.querySelector('[aria-pressed="true"]').textContent).toBe('12-hour');
});

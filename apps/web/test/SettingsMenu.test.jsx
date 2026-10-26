import { test, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { DEFAULT_UNITS } from '@bc-marine/shared';
import { useApp } from '../src/context/AppContext.jsx';
import SettingsMenu from '../src/components/SettingsMenu.jsx';

vi.mock('../src/context/AppContext.jsx', () => ({ useApp: vi.fn() }));
beforeEach(() => useApp.mockReturnValue({ units: DEFAULT_UNITS, setUnit: vi.fn() }));
afterEach(cleanup);

function openMenu() {
  fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
}

test('the settings panel is closed until the gear is pressed', () => {
  render(<SettingsMenu />);
  expect(screen.queryByRole('group', { name: 'Speed' })).toBeNull();

  openMenu();
  expect(screen.getByRole('button', { name: 'Settings' }).getAttribute('aria-expanded')).toBe(
    'true'
  );
  expect(screen.getByRole('group', { name: 'Speed' })).toBeTruthy();
});

test('pressing the gear again closes the panel', () => {
  render(<SettingsMenu />);
  openMenu();
  openMenu();
  expect(screen.queryByRole('group', { name: 'Speed' })).toBeNull();
});

test('Escape closes the panel', () => {
  render(<SettingsMenu />);
  openMenu();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('group', { name: 'Speed' })).toBeNull();
});

test('clicking outside the panel closes it', () => {
  render(
    <div>
      <p>Page content</p>
      <SettingsMenu />
    </div>
  );
  openMenu();
  fireEvent.mouseDown(screen.getByText('Page content'));
  expect(screen.queryByRole('group', { name: 'Speed' })).toBeNull();
});

test('choosing a unit keeps the panel open', () => {
  render(<SettingsMenu />);
  openMenu();
  fireEvent.mouseDown(screen.getByRole('button', { name: 'm' }));
  fireEvent.click(screen.getByRole('button', { name: 'm' }));
  expect(screen.getByRole('group', { name: 'Speed' })).toBeTruthy();
});

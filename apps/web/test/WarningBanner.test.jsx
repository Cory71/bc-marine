import { test, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import WarningBanner from '../src/components/WarningBanner.jsx';

afterEach(cleanup);

test('strong wind warnings use the amber style', () => {
  render(<WarningBanner warnings={[{ title: 'STRONG WIND WARNING IN EFFECT', summary: '' }]} />);
  expect(screen.getByRole('alert').className).not.toContain('warning-banner--severe');
});

test('the most severe warning is shown first, in the red style', () => {
  const warnings = [
    { title: 'STRONG WIND WARNING IN EFFECT', summary: '' },
    { title: 'GALE WARNING IN EFFECT', summary: '' },
  ];
  render(<WarningBanner warnings={warnings} />);
  const banner = screen.getByRole('alert');
  expect(banner.className).toContain('warning-banner--severe');
  expect(banner.textContent).toContain('GALE WARNING IN EFFECT');
  expect(banner.textContent).toContain('+1 more');
});

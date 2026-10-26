import { normalizeTheme } from '@bc-marine/shared';

const STORAGE_KEY = 'theme';

// Browser bar colours for each theme (match --color-background in tokens.css)
const BAR_COLORS = { light: '#f3f7fb', dark: '#0a1628' };

// Read the saved theme choice. Blocked storage or bad data gives "device".
export function readTheme(storage = window.localStorage) {
  try {
    return normalizeTheme(storage.getItem(STORAGE_KEY));
  } catch {
    return normalizeTheme(null);
  }
}

// Save the theme choice. Failing to save isn't worth crashing over.
export function writeTheme(theme, storage = window.localStorage) {
  try {
    storage.setItem(STORAGE_KEY, theme);
  } catch {
    // Ignore — the choice still applies for this visit
  }
}

// Show the theme: tokens.css switches colours on <html data-theme="light|dark">.
// With no attribute ("device"), the CSS follows the device setting by itself.
export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'device') delete root.dataset.theme;
  else root.dataset.theme = theme;
  updateBarColors(theme);
}

// index.html has one theme-color tag per device setting; an override sets both
function updateBarColors(theme) {
  document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
    if (!meta.dataset.deviceColor) meta.dataset.deviceColor = meta.content;
    meta.content = theme === 'device' ? meta.dataset.deviceColor : BAR_COLORS[theme];
  });
}

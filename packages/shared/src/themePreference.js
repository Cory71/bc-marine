// --- Light / dark theme choice, shared by the web and mobile apps ---

// "device" follows the phone or computer's own light/dark setting
export const DEFAULT_THEME = 'device';

export const THEME_OPTIONS = [
  { value: 'device', label: 'Device' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

// Keep a saved choice only if it's one we offer
export function normalizeTheme(saved) {
  return THEME_OPTIONS.some(option => option.value === saved) ? saved : DEFAULT_THEME;
}

// The theme to actually show. deviceScheme is 'light', 'dark' or null when unknown.
export function resolveTheme(theme, deviceScheme) {
  if (theme === 'light' || theme === 'dark') return theme;
  return deviceScheme === 'light' ? 'light' : 'dark';
}

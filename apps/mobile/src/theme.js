import { createContext, useContext } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { resolveTheme } from '@bc-marine/shared';

// App colours — dark coastal style (the original look)
export const DARK_COLORS = {
  isLight: false,
  background: '#0a1628',
  navBar: '#060f1e',
  accent: '#7ecef4',
  cardBorder: 'rgba(126,206,244,0.2)',
  cardBg: 'rgba(126,206,244,0.08)',
  textPrimary: '#ffffff',
  textSecondary: '#9cc8e8',
  textMuted: '#4a7090',
  warning: '#ff9f43',
  warningText: '#d4a96a',
  danger: '#ff7b72', // gale and above
  dangerText: '#e8a8a2',
  safe: '#4dcc88',
  // For see-through tints: `rgba(${COLORS.accentRgb},0.15)`
  accentRgb: '126,206,244',
  warningRgb: '255,159,67',
  dangerRgb: '255,123,114',
  safeRgb: '77,204,136',
};

// Light theme — same layout, darker accents so text stays readable on white
export const LIGHT_COLORS = {
  isLight: true,
  background: '#f3f7fb',
  navBar: '#e6eef6',
  accent: '#0b6fa4',
  cardBorder: 'rgba(11,111,164,0.22)',
  cardBg: '#ffffff',
  textPrimary: '#0d2236',
  textSecondary: '#3c5d7a',
  textMuted: '#56718a',
  warning: '#b45309',
  warningText: '#7a3a06',
  danger: '#c0392b',
  dangerText: '#8f2a20',
  safe: '#1e8a50',
  accentRgb: '11,111,164',
  warningRgb: '180,83,9',
  dangerRgb: '192,57,43',
  safeRgb: '30,138,80',
};

const ThemeContext = createContext(DARK_COLORS);

// Picks light or dark from the Settings choice; "device" follows the phone's setting
export function ThemeProvider({ theme, children }) {
  const deviceScheme = useColorScheme();
  const colors = resolveTheme(theme, deviceScheme) === 'light' ? LIGHT_COLORS : DARK_COLORS;
  return <ThemeContext.Provider value={colors}>{children}</ThemeContext.Provider>;
}

// The current theme's colours: const COLORS = useColors();
export function useColors() {
  return useContext(ThemeContext);
}

// Styles that follow the theme. Build once per theme, then reuse:
//   const useStyles = makeStyles(COLORS => ({ title: { color: COLORS.textPrimary } }));
//   const styles = useStyles(); // inside the component
export function makeStyles(createStyles) {
  const stylesByTheme = new Map();
  return function useStyles() {
    const colors = useColors();
    if (!stylesByTheme.has(colors)) {
      stylesByTheme.set(colors, StyleSheet.create(createStyles(colors)));
    }
    return stylesByTheme.get(colors);
  };
}

import { degreesToCompass } from './units.js';
import { DEFAULT_UNITS, formatSpeed, formatHeight } from './unitPreferences.js';

// Display text for lighthouse and buoy readings. Units come from the person's
// chosen units (unitPreferences.js); readings themselves stay in kts, ft and °C.

const NO_VALUE = '--';
const MINUTE_MS = 60 * 1000;
const OLD_READING_MS = 3 * 60 * MINUTE_MS;

// 'E 17 kts' — speed only if the direction is missing
export function formatWind(reading, units = DEFAULT_UNITS) {
  if (reading?.windKts == null) return NO_VALUE;
  const speed = formatSpeed(reading.windKts, units);
  return reading.windDirDeg == null ? speed : `${degreesToCompass(reading.windDirDeg)} ${speed}`;
}

export function formatGust(reading, units = DEFAULT_UNITS) {
  return formatSpeed(reading?.gustKts, units);
}

export function formatWaves(reading, units = DEFAULT_UNITS) {
  return formatHeight(reading?.waveHeightFt, units);
}

export function formatWavePeriod(reading) {
  return reading?.wavePeriodS == null ? NO_VALUE : `${reading.wavePeriodS} s`;
}

export function formatPressure(reading) {
  return reading?.pressureHpa == null ? NO_VALUE : `${reading.pressureHpa} hPa`;
}

// 'just now', '40 min ago', '2 h ago', '3 d ago'
export function formatReadingAge(observedAt, now = new Date()) {
  const minutes = Math.floor((now - new Date(observedAt)) / MINUTE_MS);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  // A station that stopped reporting days ago should read as days, not '2400 h'
  if (hours < 48) return `${hours} h ago`;
  return `${Math.floor(hours / 24)} d ago`;
}

// Readings older than 3 hours are shown dimmed as "Old reading"
export function isOldReading(observedAt, now = new Date()) {
  return now - new Date(observedAt) > OLD_READING_MS;
}

// Short line for the dashboard card: gusts for lighthouses, waves for buoys
export function summarizeObservation({ site, reading }, units = DEFAULT_UNITS) {
  if (!reading) return 'No recent report';
  const extra = observationDetail({ site, reading }, units);
  return extra ? `${formatWind(reading, units)}, ${extra}` : formatWind(reading, units);
}

// The second value for a site, shown beside its wind: gust for lighthouses, waves for buoys
export function observationDetail({ site, reading }, units = DEFAULT_UNITS) {
  if (!reading) return '';
  if (site.type === 'buoy')
    return reading.waveHeightFt == null ? '' : `waves ${formatWaves(reading, units)}`;
  return reading.gustKts == null ? '' : `gust ${formatGust(reading, units)}`;
}

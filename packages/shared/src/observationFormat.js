import { degreesToCompass } from './units.js';

// Display text for lighthouse and buoy readings. Every unit shown to the user
// comes from this file, so the future units preferences only change it here.

const NO_VALUE = '--';
const MINUTE_MS = 60 * 1000;
const OLD_READING_MS = 3 * 60 * MINUTE_MS;

// Add a unit to a number, or '--' when it's missing
function withUnit(value, unit) {
  return value == null ? NO_VALUE : `${value} ${unit}`;
}

// 'E 17 kts' — speed only if the direction is missing
export function formatWind(reading) {
  if (reading?.windKts == null) return NO_VALUE;
  const speed = `${reading.windKts} kts`;
  return reading.windDirDeg == null ? speed : `${degreesToCompass(reading.windDirDeg)} ${speed}`;
}

export function formatGust(reading) {
  return withUnit(reading?.gustKts, 'kts');
}

export function formatWaves(reading) {
  return withUnit(reading?.waveHeightFt, 'ft');
}

export function formatWavePeriod(reading) {
  return withUnit(reading?.wavePeriodS, 's');
}

export function formatPressure(reading) {
  return withUnit(reading?.pressureHpa, 'hPa');
}

export function formatTemp(celsius) {
  return withUnit(celsius, '°C');
}

export function formatDistance(km) {
  return withUnit(km == null ? null : Math.round(km), 'km');
}

// 'just now', '40 min ago', '2 h ago'
export function formatReadingAge(observedAt, now = new Date()) {
  const minutes = Math.floor((now - new Date(observedAt)) / MINUTE_MS);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.floor(minutes / 60)} h ago`;
}

// Readings older than 3 hours are shown dimmed as "Old reading"
export function isOldReading(observedAt, now = new Date()) {
  return now - new Date(observedAt) > OLD_READING_MS;
}

// Short line for the dashboard card: gusts for lighthouses, waves for buoys
export function summarizeObservation({ site, reading }) {
  if (!reading) return 'No recent report';
  const extra =
    site.type === 'buoy'
      ? reading.waveHeightFt != null && `waves ${formatWaves(reading)}`
      : reading.gustKts != null && `gust ${reading.gustKts}`;
  return extra ? `${formatWind(reading)}, ${extra}` : formatWind(reading);
}

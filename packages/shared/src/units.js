import SunCalc from 'suncalc';
import { formatBcTime } from './bcTime.js';

// Convert DFO metres to feet
export function metresToFeet(metres) {
  return (metres * 3.28084).toFixed(1);
}

// Format a JS Date in BC time: "9:15 AM", or "09:15" on the 24-hour clock
export function formatTime(date, units) {
  return formatBcTime(date, units?.time ?? '12h');
}

// A short label for an on-the-hour chart tick: '6 AM', or '06:00' on the 24-hour clock
export function formatHourLabel(date, units) {
  const time = formatTime(date, units);
  return units?.time === '24h' ? time : time.replace(':00', '');
}

// Returns "Updated 9:15 AM PT" string from a timestamp
export function timeSince(date, units) {
  return `Updated ${formatTime(date, units)} PT`;
}

// Returns sunrise, sunset, and moon phase for a given lat/lon
export function getSunMoon(lat, lon, units) {
  const now = new Date();
  const times = SunCalc.getTimes(now, lat, lon);
  const moonIllum = SunCalc.getMoonIllumination(now);

  const phaseNames = [
    'New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
    'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent',
  ];
  const phaseIndex = Math.round(moonIllum.phase * 8) % 8;

  return {
    sunrise: formatTime(times.sunrise, units),
    sunset: formatTime(times.sunset, units),
    moonPhase: phaseNames[phaseIndex],
  };
}

// Converts a wind/swell direction in degrees to an 8-point compass label
export function degreesToCardinal(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

// Converts a direction in degrees to a 16-point compass label ('SSE'), or '--' if missing
export function degreesToCompass(deg) {
  if (deg == null) return '--';
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

// Great-circle distance in km between two lat/lon points (haversine formula)
export function distanceKm(lat1, lon1, lat2, lon2) {
  const EARTH_RADIUS_KM = 6371;
  const toRadians = degrees => (degrees * Math.PI) / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

// Returns the nearest station to a given GPS coordinate, by real distance in km
// (a degree of longitude is only about 2/3 as far as a degree of latitude in BC)
export function findNearestStation(lat, lon, stations) {
  let nearest = null;
  let minDist = Infinity;
  for (const station of stations) {
    const dist = distanceKm(lat, lon, station.lat, station.lon);
    if (dist < minDist) {
      minDist = dist;
      nearest = station;
    }
  }
  return nearest;
}

// Computers without GPS guess their location from the internet connection, which can be
// tens of km off. A fix only known to within 10 km or more is too rough to trust silently.
const ROUGH_LOCATION_METRES = 10000;

export function isRoughLocation(accuracyMetres) {
  return accuracyMetres >= ROUGH_LOCATION_METRES;
}

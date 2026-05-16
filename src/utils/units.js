import SunCalc from 'suncalc';

// Convert DFO metres to feet
export function metresToFeet(metres) {
  return (metres * 3.28084).toFixed(1);
}

// Format a JS Date to "9:15 AM"
export function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-CA', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Returns "Updated 9:15 AM" string from a timestamp
export function timeSince(date) {
  return `Updated ${formatTime(date)}`;
}

// Returns sunrise, sunset, and moon phase for a given lat/lon
export function getSunMoon(lat, lon) {
  const now = new Date();
  const times = SunCalc.getTimes(now, lat, lon);
  const moonIllum = SunCalc.getMoonIllumination(now);

  const phaseNames = [
    'New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
    'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent',
  ];
  const phaseIndex = Math.round(moonIllum.phase * 8) % 8;

  return {
    sunrise: formatTime(times.sunrise),
    sunset: formatTime(times.sunset),
    moonPhase: phaseNames[phaseIndex],
  };
}

// Converts a wind/swell direction in degrees to an 8-point compass label
export function degreesToCardinal(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

// Returns the nearest station to a given GPS coordinate
export function findNearestStation(lat, lon, stations) {
  let nearest = null;
  let minDist = Infinity;
  for (const station of stations) {
    const dist = Math.sqrt(
      Math.pow(station.lat - lat, 2) + Math.pow(station.lon - lon, 2)
    );
    if (dist < minDist) {
      minDist = dist;
      nearest = station;
    }
  }
  return nearest;
}

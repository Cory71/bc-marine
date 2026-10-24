// Helpers that pick out the reading or event the screens show "right now"

// Return the reading whose time is closest to now, or null if there are none
export function findClosestReading(readings, now = new Date()) {
  if (!readings || readings.length === 0) return null;
  return readings.reduce((closest, reading) =>
    Math.abs(new Date(reading.time) - now) < Math.abs(new Date(closest.time) - now) ? reading : closest
  );
}

// Return the first tide event after now — optionally only 'HIGH' or 'LOW'
export function getNextTideEvent(events, type, now = new Date()) {
  const next = (events ?? []).find(event =>
    (!type || event.type === type) && new Date(event.time) > now
  );
  return next ?? null;
}

// Flood/ebb: compare this hour's current speed to the previous hour's.
// Returns null when there is no current data for this hour.
export function getCurrentPhase(weather, now = new Date()) {
  const current = findClosestReading(weather, now);
  const currentSpeed = current?.currentSpeedKts ?? null;
  if (currentSpeed == null) return null;

  const previousSpeed = weather[weather.indexOf(current) - 1]?.currentSpeedKts ?? 0;
  return currentSpeed >= previousSpeed ? 'Flooding' : 'Ebbing';
}

// True when at least one hour has a current speed (many stations have none)
export function hasCurrentData(weather) {
  return Boolean(weather?.some(hour => hour.currentSpeedKts != null));
}

// The closest hour plus the following hours, e.g. for an 8-hour table
export function getUpcomingHours(readings, count = 8, now = new Date()) {
  const closest = findClosestReading(readings, now);
  if (!closest) return [];
  const startIndex = readings.indexOf(closest);
  return readings.slice(startIndex, startIndex + count);
}

// 'Rising' or 'Falling': compare the first reading after now with the one before it
export function getTideTrend(tides, now = new Date()) {
  const nextIndex = (tides ?? []).findIndex(tide => new Date(tide.time) >= now);
  if (nextIndex <= 0) return null;
  return tides[nextIndex].heightFt > tides[nextIndex - 1].heightFt ? 'Rising' : 'Falling';
}

// Tide events from an hour ago onward, so a tide that just turned is still listed
export function getRecentAndUpcomingEvents(events, now = new Date()) {
  const ONE_HOUR_MS = 60 * 60 * 1000;
  return (events ?? []).filter(event => new Date(event.time) > now - ONE_HOUR_MS);
}

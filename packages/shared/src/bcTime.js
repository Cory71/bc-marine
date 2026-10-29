// BC Pacific time helpers — every time the apps show is in BC time,
// no matter which time zone the viewer's device uses
export const BC_TIME_ZONE = 'America/Vancouver';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_MINUTE_MS = 60 * 1000;

// Parse an API timestamp like '2026-10-24T17:00' as UTC (not device time)
export function parseUtcTimestamp(text) {
  // Leave timestamps that already carry a zone ('Z' or '+01:00') alone
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(text);
  return new Date(hasZone ? text : `${text}Z`);
}

// Return the parts of a date (year, hour, weekday, ...) as seen in BC
function getBcParts(date, options) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: BC_TIME_ZONE, ...options })
    .formatToParts(new Date(date));
  return Object.fromEntries(parts.map(part => [part.type, part.value]));
}

// Return today's (or a given date's) BC calendar date as 'YYYY-MM-DD'
export function getBcDateString(date = new Date()) {
  const { year, month, day } = getBcParts(date, { year: 'numeric', month: '2-digit', day: '2-digit' });
  return `${year}-${month}-${day}`;
}

// Add whole days to a 'YYYY-MM-DD' string
export function addDaysToDateString(dateString, days) {
  const utcMs = Date.parse(`${dateString}T00:00:00Z`) + days * ONE_DAY_MS;
  return new Date(utcMs).toISOString().slice(0, 10);
}

// Pacific offset (minutes) at a given UTC instant, e.g. -420 for PDT
function getBcOffsetMinutes(utcMs) {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: BC_TIME_ZONE, timeZoneName: 'longOffset' })
    .formatToParts(utcMs).find(part => part.type === 'timeZoneName').value; // "GMT-07:00"
  const [, sign, hh, mm] = name.match(/GMT([+-])(\d{2}):(\d{2})/);
  return (sign === '-' ? -1 : 1) * (Number(hh) * 60 + Number(mm));
}

// BC midnight → UTC: guess with that day's UTC-midnight offset, then correct once with the offset at the guess
function getBcMidnightUtcMs(dateString) {
  const naiveUtc = Date.parse(`${dateString}T00:00:00Z`);
  const firstGuess = naiveUtc - getBcOffsetMinutes(naiveUtc) * ONE_MINUTE_MS;
  return naiveUtc - getBcOffsetMinutes(firstGuess) * ONE_MINUTE_MS;
}

// Format a UTC time in ms as '2026-10-24T07:00:00Z' (no milliseconds)
function toIsoSeconds(utcMs) {
  return new Date(utcMs).toISOString().replace('.000Z', 'Z');
}

// UTC start and end of a BC calendar day — handles 23 h and 25 h DST days
export function getBcDayRangeUtc(dateString) {
  const startMs = getBcMidnightUtcMs(dateString);
  const nextStartMs = getBcMidnightUtcMs(addDaysToDateString(dateString, 1));
  return { from: toIsoSeconds(startMs), to: toIsoSeconds(nextStartMs - 1000) };
}

// Format a time in BC time: '9:15 AM', or '09:15' on the 24-hour clock
export function formatBcTime(date, clock = '12h') {
  if (clock === '24h') {
    // hourCycle h23 counts 00-23, so midnight is 00:00 rather than 24:00
    const { hour, minute } = getBcParts(date, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    return `${hour}:${minute}`;
  }
  const { hour, minute, dayPeriod } = getBcParts(date, { hour: 'numeric', minute: '2-digit', hour12: true });
  // en-CA prints 'a.m.' — turn it into 'AM' to match the mobile app
  const period = dayPeriod.replace(/\./g, '').toUpperCase();
  return `${hour}:${minute} ${period}`;
}

// Format a date as a short weekday ('Mon') in BC time
export function formatBcWeekday(date) {
  return getBcParts(date, { weekday: 'short' }).weekday;
}

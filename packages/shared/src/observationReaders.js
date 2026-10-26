import { metresToFeet } from './units.js';

// Turn raw lighthouse (EC) and buoy (NOAA) data into one reading shape:
// { observedAt, windKts, windDirDeg, gustKts, waveHeightFt, wavePeriodS,
//   pressureHpa, airTempC, waterTempC } — null for anything not reported.

const KNOTS_PER_KMH = 0.539957;
const KNOTS_PER_MS = 1.943844;

// Read one EC GeoMet swob-realtime feature's properties (wind in km/h)
export function readLighthouseFeature(properties) {
  const observedAt = new Date(properties?.obs_date_tm);
  if (!properties?.obs_date_tm || !isValidDate(observedAt)) return null;
  // Prefer the 10-minute average; fall back to the 2-minute, then the hourly one
  const windKmh = firstNumber(properties, [
    'avg_wnd_spd_10m_pst10mts',
    'avg_wnd_spd_10m_pst2mts',
    'avg_wnd_spd_10m_pst1hr',
  ]);
  const windDir = firstNumber(properties, [
    'avg_wnd_dir_10m_pst10mts',
    'avg_wnd_dir_10m_pst2mts',
    'avg_wnd_dir_10m_pst1hr',
  ]);

  return {
    ...emptyReading(),
    observedAt,
    windKts: kmhToKnots(windKmh),
    windDirDeg: windDir,
    gustKts: kmhToKnots(numberOrNull(properties.max_wnd_spd_10m_pst1hr)),
    pressureHpa: numberOrNull(properties.stn_pres),
    airTempC: numberOrNull(properties.air_temp),
  };
}

// Read the newest row of a NOAA NDBC realtime2 text file (wind in m/s, waves in m)
export function parseNdbcText(text) {
  return parseNdbcRows(text, 1)[0] ?? null;
}

// Read up to `limit` rows, newest first (NOAA lists them newest first, one per hour),
// skipping any row whose time can't be read
export function parseNdbcRows(text, limit) {
  const lines = String(text ?? '').split('\n');
  const header = lines.find(line => line.startsWith('#'));
  if (!header) return [];

  // Look columns up by name, so a changed column order can't shift values
  const columns = header.replace('#', '').trim().split(/\s+/);
  return lines
    .filter(line => line.trim() && !line.startsWith('#'))
    .map(line => readNdbcRow(columns, line.trim().split(/\s+/)))
    .filter(Boolean)
    .slice(0, limit);
}

// One NOAA row → a reading, or null if its time is incomplete
function readNdbcRow(columns, values) {
  const value = name => numberOrNull(values[columns.indexOf(name)]);
  const waveHeightM = value('WVHT');

  // A row without a complete time can't be shown honestly (a missing year would
  // otherwise quietly become 1900)
  const [year, month, day, hour, minute] = ['YY', 'MM', 'DD', 'hh', 'mm'].map(value);
  if ([year, month, day, hour, minute].some(part => part == null)) return null;

  return {
    observedAt: new Date(Date.UTC(year, month - 1, day, hour, minute)),
    windKts: msToKnots(value('WSPD')),
    windDirDeg: value('WDIR'),
    gustKts: msToKnots(value('GST')),
    waveHeightFt: waveHeightM == null ? null : parseFloat(metresToFeet(waveHeightM)),
    wavePeriodS: value('DPD'),
    pressureHpa: value('PRES'),
    airTempC: value('ATMP'),
    waterTempC: value('WTMP'),
  };
}

function isValidDate(date) {
  return !Number.isNaN(date.getTime());
}

function emptyReading() {
  return {
    observedAt: null,
    windKts: null,
    windDirDeg: null,
    gustKts: null,
    waveHeightFt: null,
    wavePeriodS: null,
    pressureHpa: null,
    airTempC: null,
    waterTempC: null,
  };
}

// A number, or null for missing values ('MM', '', undefined, NaN)
function numberOrNull(raw) {
  if (raw == null || raw === '' || raw === 'MM') return null;
  const number = Number(raw);
  return Number.isFinite(number) ? number : null;
}

// The first of several fields that has a number
function firstNumber(properties, fieldNames) {
  for (const name of fieldNames) {
    const number = numberOrNull(properties[name]);
    if (number != null) return number;
  }
  return null;
}

function kmhToKnots(kmh) {
  return kmh == null ? null : Math.round(kmh * KNOTS_PER_KMH);
}

function msToKnots(ms) {
  return ms == null ? null : Math.round(ms * KNOTS_PER_MS);
}

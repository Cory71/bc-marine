import { metresToFeet } from './units.js';

// Turn raw lighthouse (EC) and buoy (NOAA) data into one reading shape:
// { observedAt, windKts, windDirDeg, gustKts, waveHeightFt, wavePeriodS,
//   pressureHpa, airTempC, waterTempC } — null for anything not reported.

const KNOTS_PER_KMH = 0.539957;
const KNOTS_PER_MS = 1.943844;

// Read one EC GeoMet swob-realtime feature's properties (wind in km/h)
export function readLighthouseFeature(properties) {
  if (!properties?.obs_date_tm) return null;
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
    observedAt: new Date(properties.obs_date_tm),
    windKts: kmhToKnots(windKmh),
    windDirDeg: windDir,
    gustKts: kmhToKnots(numberOrNull(properties.max_wnd_spd_10m_pst1hr)),
    pressureHpa: numberOrNull(properties.stn_pres),
    airTempC: numberOrNull(properties.air_temp),
  };
}

// Read the newest row of a NOAA NDBC realtime2 text file (wind in m/s, waves in m)
export function parseNdbcText(text) {
  const lines = String(text ?? '').split('\n');
  const header = lines.find(line => line.startsWith('#'));
  const row = lines.find(line => line.trim() && !line.startsWith('#'));
  if (!header || !row) return null;

  // Look columns up by name, so a changed column order can't shift values
  const columns = header.replace('#', '').trim().split(/\s+/);
  const values = row.trim().split(/\s+/);
  const value = name => numberOrNull(values[columns.indexOf(name)]);
  const waveHeightM = value('WVHT');

  return {
    observedAt: new Date(
      Date.UTC(value('YY'), value('MM') - 1, value('DD'), value('hh'), value('mm'))
    ),
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

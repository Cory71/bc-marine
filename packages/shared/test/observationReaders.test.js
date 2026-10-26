import { test, expect } from 'vitest';
import { readLighthouseFeature, parseNdbcText } from '../src/observationReaders.js';

// Race Rocks, as returned by EC GeoMet swob-realtime (only the fields we use)
const RACE_ROCKS = {
  obs_date_tm: '2026-10-25T23:23:00.000Z',
  avg_wnd_spd_10m_pst10mts: 32.2,
  avg_wnd_dir_10m_pst10mts: 86,
  max_wnd_spd_10m_pst1hr: 45.8,
  stn_pres: 1007.5,
  air_temp: 11.3,
};

const NDBC_HEADER =
  '#YY  MM DD hh mm WDIR WSPD GST  WVHT   DPD   APD MWD   PRES  ATMP  WTMP  DEWP  VIS PTDY  TIDE\n' +
  '#yr  mo dy hr mn degT m/s  m/s     m   sec   sec degT   hPa  degC  degC  degC  nmi  hPa    ft\n';

test('readLighthouseFeature converts EC km/h readings to knots', () => {
  const reading = readLighthouseFeature(RACE_ROCKS);
  expect(reading.observedAt.toISOString()).toBe('2026-10-25T23:23:00.000Z');
  expect(reading).toMatchObject({
    windKts: 17,
    windDirDeg: 86,
    gustKts: 25,
    pressureHpa: 1007.5,
    airTempC: 11.3,
    waveHeightFt: null,
  });
});

test('readLighthouseFeature falls back to the 2-minute wind when the 10-minute one is missing', () => {
  const properties = {
    ...RACE_ROCKS,
    avg_wnd_spd_10m_pst10mts: undefined,
    avg_wnd_spd_10m_pst2mts: 37.2,
  };
  expect(readLighthouseFeature(properties).windKts).toBe(20);
});

test('readLighthouseFeature returns null without an observation time', () =>
  expect(readLighthouseFeature({ air_temp: 11 })).toBeNull());

test('parseNdbcText reads the newest NOAA row', () => {
  const text =
    NDBC_HEADER +
    '2026 10 25 23 00 270  4.0  4.0   0.4     4    MM  MM 1014.5  10.0  11.1    MM   MM -0.2    MM\n' +
    '2026 10 25 22 00 250  4.0  4.0   0.5     4    MM  MM 1014.6  10.1  11.1    MM   MM +0.1    MM\n';
  const reading = parseNdbcText(text);
  expect(reading.observedAt.toISOString()).toBe('2026-10-25T23:00:00.000Z');
  expect(reading).toMatchObject({
    windKts: 8,
    windDirDeg: 270,
    gustKts: 8,
    waveHeightFt: 1.3,
    wavePeriodS: 4,
    pressureHpa: 1014.5,
    airTempC: 10,
    waterTempC: 11.1,
  });
});

test('parseNdbcText turns MM (missing) values into null, never NaN', () => {
  const text =
    NDBC_HEADER +
    '2026 10 25 23 00  MM   MM   MM    MM    MM    MM  MM     MM    MM    MM    MM   MM    MM    MM\n';
  const reading = parseNdbcText(text);
  expect(reading.windKts).toBeNull();
  expect(reading.waveHeightFt).toBeNull();
  expect(JSON.stringify(reading)).not.toContain('NaN');
});

test('parseNdbcText returns null when there are no data rows', () =>
  expect(parseNdbcText(NDBC_HEADER)).toBeNull());

test('an unreadable observation time gives no reading, never "NaN"', () => {
  expect(readLighthouseFeature({ ...RACE_ROCKS, obs_date_tm: 'not a date' })).toBeNull();
  const badTime =
    NDBC_HEADER +
    'MM MM 25 23 00 270  4.0  4.0   0.4     4    MM  MM 1014.5  10.0  11.1    MM   MM -0.2    MM\n';
  expect(parseNdbcText(badTime)).toBeNull();
});

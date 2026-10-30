import { test, expect } from 'vitest';
import { readLighthouseFeature, parseNdbcText, parseNdbcRows } from '../src/observationReaders.js';

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

test('parseNdbcRows returns the newest hourly rows first, up to a limit, skipping unreadable ones', () => {
  const text =
    NDBC_HEADER +
    '2026 10 25 23 00 270  4.0  4.0   0.4     4    MM  MM 1014.5  10.0  11.1    MM   MM -0.2    MM\n' +
    'MM   10 25 22 00 250  4.0  4.0   0.5     4    MM  MM 1014.6  10.1  11.1    MM   MM +0.1    MM\n' +
    '2026 10 25 21 00 240  5.0  6.0   0.6     5    MM  MM 1014.8  10.2  11.1    MM   MM +0.1    MM\n' +
    '2026 10 25 20 00 230  6.0  7.0   0.7     5    MM  MM 1015.0  10.3  11.1    MM   MM +0.1    MM\n';
  const rows = parseNdbcRows(text, 2);
  expect(rows.map(r => r.observedAt.toISOString())).toEqual([
    '2026-10-25T23:00:00.000Z',
    '2026-10-25T21:00:00.000Z',
  ]);
  expect(rows[1].windKts).toBe(10);
  expect(parseNdbcRows(NDBC_HEADER, 12)).toEqual([]);
});

// Ballenas Island, 28 Oct 9 PM: EC marked a 326 km/h (176 kt) gust as failing its quality check
const BALLENAS_BAD_GUST = {
  obs_date_tm: '2026-10-29T04:00:00.000Z',
  avg_wnd_spd_10m_pst10mts: 11.2,
  'avg_wnd_spd_10m_pst10mts-qa': 100,
  avg_wnd_dir_10m_pst10mts: 126,
  'avg_wnd_dir_10m_pst10mts-qa': 100,
  max_wnd_spd_10m_pst1hr: 326.1,
  'max_wnd_spd_10m_pst1hr-qa': 0,
};

test('a reading that failed EC quality control is treated as missing', () => {
  const reading = readLighthouseFeature(BALLENAS_BAD_GUST);
  expect(reading.gustKts).toBeNull();
  expect(reading.windKts).toBe(6);
});

test('a failed wind average falls back to the next one that passed', () => {
  const reading = readLighthouseFeature({
    obs_date_tm: '2026-10-29T04:00:00.000Z',
    avg_wnd_spd_10m_pst10mts: 300,
    'avg_wnd_spd_10m_pst10mts-qa': 0,
    avg_wnd_spd_10m_pst2mts: 37.04,
    'avg_wnd_spd_10m_pst2mts-qa': 100,
  });
  expect(reading.windKts).toBe(20);
});

// Entrance Island, 29 Oct 9 PM: one sensor spiked to 143 km/h (77 kts) and EC passed it,
// while the station's second sensor saw 12.8 km/h (7 kts)
const ENTRANCE_ISLAND_SPIKE = {
  obs_date_tm: '2026-10-30T04:00:00.000Z',
  avg_wnd_spd_10m_pst10mts: 6.5,
  'avg_wnd_spd_10m_pst10mts-qa': 100,
  max_wnd_spd_10m_pst1hr: 143.2,
  'max_wnd_spd_10m_pst1hr-qa': 100,
  max_wnd_spd_10m_pst1hr_1: 143.2,
  max_wnd_spd_10m_pst1hr_2: 12.8,
};

test('when the two wind sensors disagree wildly, the gust uses the lower one', () =>
  expect(readLighthouseFeature(ENTRANCE_ISLAND_SPIKE).gustKts).toBe(7));

test('when the two sensors roughly agree, the main gust is kept', () => {
  const agreeing = { ...ENTRANCE_ISLAND_SPIKE, max_wnd_spd_10m_pst1hr: 25.2 };
  agreeing.max_wnd_spd_10m_pst1hr_1 = 25.2;
  agreeing.max_wnd_spd_10m_pst1hr_2 = 24.9;
  expect(readLighthouseFeature(agreeing).gustKts).toBe(14);
});

test('a backup sensor reading below the average wind is broken, so the main gust is kept', () => {
  // Estevan Point, 29 Oct 7 PM: the second sensor read 0 while the wind averaged 15 km/h
  const deadBackup = {
    obs_date_tm: '2026-10-30T02:00:00.000Z',
    avg_wnd_spd_10m_pst10mts: 15,
    avg_wnd_spd_10m_pst1hr: 15,
    max_wnd_spd_10m_pst1hr: 28.7,
    max_wnd_spd_10m_pst1hr_1: 28.7,
    max_wnd_spd_10m_pst1hr_2: 0,
  };
  expect(readLighthouseFeature(deadBackup).gustKts).toBe(15);
});

test('a spiking main sensor does not make a healthy backup look broken', () => {
  // Ballenas Island, 29 Oct 8 PM: the main sensor spiked (99 km/h max, 46 km/h 10-minute
  // average), while the backup saw 34.7 km/h, above the hour's 31.5 km/h average
  const spiking = {
    obs_date_tm: '2026-10-30T03:00:00.000Z',
    avg_wnd_spd_10m_pst10mts: 46,
    avg_wnd_spd_10m_pst1hr: 31.5,
    max_wnd_spd_10m_pst1hr: 99.1,
    max_wnd_spd_10m_pst1hr_1: 99.1,
    max_wnd_spd_10m_pst1hr_2: 34.7,
  };
  expect(readLighthouseFeature(spiking).gustKts).toBe(19);
});

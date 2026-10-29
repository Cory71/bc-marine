// The units people can choose, and the one place values are converted for display.
// Data is always stored in knots, feet, °C, km and hPa; only the text shown changes.

const NO_VALUE = '--';
const KMH_PER_KNOT = 1.852;
const MPH_PER_KNOT = 1.150779;
const METRES_PER_FOOT = 0.3048;
const KM_PER_NAUTICAL_MILE = 1.852;
const KM_PER_MILE = 1.609344;
const KPA_PER_HPA = 0.1;
const INHG_PER_HPA = 0.02953;

// The app's original units stay the defaults
export const DEFAULT_UNITS = {
  speed: 'kts',
  height: 'ft',
  temperature: 'c',
  distance: 'km',
  pressure: 'hpa',
  time: '12h',
};

// Choices for each kind of unit, in the order they're offered.
// label is the Settings button; unit (when different) is what readings show.
export const UNIT_OPTIONS = {
  speed: [
    { value: 'kts', label: 'kts' },
    { value: 'kmh', label: 'km/h' },
    { value: 'mph', label: 'mph' },
  ],
  height: [
    { value: 'ft', label: 'ft' },
    { value: 'm', label: 'm' },
  ],
  temperature: [
    { value: 'c', label: '°C' },
    { value: 'f', label: '°F' },
  ],
  distance: [
    { value: 'km', label: 'km' },
    { value: 'mi', label: 'mi' }, // statute (land) miles
    { value: 'nm', label: 'nm' },
  ],
  pressure: [
    { value: 'hpa', label: 'hPa (mb)', unit: 'hPa' }, // millibars are the same as hPa
    { value: 'kpa', label: 'kPa' },
    { value: 'inhg', label: 'inHg' },
  ],
  time: [
    { value: '12h', label: '12-hour' },
    { value: '24h', label: '24-hour' },
  ],
};

// Keep saved choices that are still valid; anything missing or unknown falls back to the default
export function normalizeUnits(saved) {
  const units = { ...DEFAULT_UNITS };
  if (!saved || typeof saved !== 'object') return units;
  for (const kind of Object.keys(DEFAULT_UNITS)) {
    const isValid = UNIT_OPTIONS[kind].some(option => option.value === saved[kind]);
    if (isValid) units[kind] = saved[kind];
  }
  return units;
}

// The unit shown after a reading, e.g. 'kmh' → 'km/h', 'hpa' → 'hPa'
export function unitLabel(kind, value) {
  const option = UNIT_OPTIONS[kind].find(item => item.value === value);
  return option.unit ?? option.label;
}

// Round to a number of decimals, dropping a trailing '.0' (8.0 → 8)
function roundTo(value, decimals) {
  return Number(value.toFixed(decimals));
}

// A speed as a plain number in the chosen unit, for charts
export function speedInUnits(knots, units = DEFAULT_UNITS) {
  const factor = { kts: 1, kmh: KMH_PER_KNOT, mph: MPH_PER_KNOT }[units.speed];
  return knots * factor;
}

// Wind, gust or current speed, from knots: '12 kts', '22 km/h', '14 mph'
export function formatSpeed(knots, units = DEFAULT_UNITS, decimals = 0) {
  if (knots == null) return NO_VALUE;
  return `${roundTo(speedInUnits(knots, units), decimals)} ${unitLabel('speed', units.speed)}`;
}

// A height (tides, waves, swell) as a plain number in the chosen unit, for charts
export function heightInUnits(feet, units = DEFAULT_UNITS) {
  return units.height === 'm' ? feet * METRES_PER_FOOT : feet;
}

// A height, from feet: '8.4 ft' or '2.6 m'
export function formatHeight(feet, units = DEFAULT_UNITS) {
  if (feet == null) return NO_VALUE;
  return `${roundTo(heightInUnits(feet, units), 1)} ${unitLabel('height', units.height)}`;
}

// A temperature, from °C: '11.3 °C' or '52.3 °F'
export function formatTemp(celsius, units = DEFAULT_UNITS) {
  if (celsius == null) return NO_VALUE;
  const value = units.temperature === 'f' ? (celsius * 9) / 5 + 32 : celsius;
  return `${roundTo(value, 1)} ${unitLabel('temperature', units.temperature)}`;
}

// A distance or visibility, from km: '18 km', '11 mi' or '10 nm'
export function formatDistance(km, units = DEFAULT_UNITS) {
  if (km == null) return NO_VALUE;
  const kmPerUnit = { km: 1, mi: KM_PER_MILE, nm: KM_PER_NAUTICAL_MILE }[units.distance] ?? 1;
  const value = km / kmPerUnit;
  return `${Math.round(value)} ${unitLabel('distance', units.distance)}`;
}

// The chosen pressure unit; settings saved before pressure was added default to hPa
function pressureUnit(units) {
  return units?.pressure ?? DEFAULT_UNITS.pressure;
}

// A pressure as a plain number in the chosen unit, for charts
export function pressureInUnits(hpa, units = DEFAULT_UNITS) {
  const factor = { hpa: 1, kpa: KPA_PER_HPA, inhg: INHG_PER_HPA }[pressureUnit(units)];
  return hpa * factor;
}

// How many decimals a pressure shows: kPa and inHg move in hundredths
export function pressureDecimals(units = DEFAULT_UNITS) {
  return pressureUnit(units) === 'hpa' ? 1 : 2;
}

// A pressure, from hPa: '1015.6 hPa', '101.56 kPa' or '29.99 inHg'
export function formatPressureHpa(hpa, units = DEFAULT_UNITS) {
  if (hpa == null) return NO_VALUE;
  const value = pressureInUnits(hpa, units).toFixed(pressureDecimals(units));
  return `${value} ${unitLabel('pressure', pressureUnit(units))}`;
}

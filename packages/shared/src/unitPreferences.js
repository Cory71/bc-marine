// The units people can choose, and the one place values are converted for display.
// Data is always stored in knots, feet, °C and km; only the text shown changes.

const NO_VALUE = '--';
const KMH_PER_KNOT = 1.852;
const MPH_PER_KNOT = 1.150779;
const METRES_PER_FOOT = 0.3048;
const KM_PER_NAUTICAL_MILE = 1.852;

// The app's original units stay the defaults
export const DEFAULT_UNITS = { speed: 'kts', height: 'ft', temperature: 'c', distance: 'km' };

// Choices for each kind of unit, in the order they're offered
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
    { value: 'nm', label: 'nm' },
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

// The label for a unit value, e.g. 'kmh' → 'km/h'
function unitLabel(kind, value) {
  return UNIT_OPTIONS[kind].find(option => option.value === value).label;
}

// Round to a number of decimals, dropping a trailing '.0' (8.0 → 8)
function roundTo(value, decimals) {
  return Number(value.toFixed(decimals));
}

// Wind, gust or current speed, from knots: '12 kts', '22 km/h', '14 mph'
export function formatSpeed(knots, units = DEFAULT_UNITS, decimals = 0) {
  if (knots == null) return NO_VALUE;
  const factor = { kts: 1, kmh: KMH_PER_KNOT, mph: MPH_PER_KNOT }[units.speed];
  return `${roundTo(knots * factor, decimals)} ${unitLabel('speed', units.speed)}`;
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

// A distance or visibility, from km: '18 km' or '10 nm'
export function formatDistance(km, units = DEFAULT_UNITS) {
  if (km == null) return NO_VALUE;
  const value = units.distance === 'nm' ? km / KM_PER_NAUTICAL_MILE : km;
  return `${Math.round(value)} ${unitLabel('distance', units.distance)}`;
}

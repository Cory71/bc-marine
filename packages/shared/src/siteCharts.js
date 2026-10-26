import { formatTime } from './units.js';
import { DEFAULT_UNITS, speedInUnits, heightInUnits, unitLabel } from './unitPreferences.js';

// Chart data and drawing maths for a lighthouse or buoy's last 12 hours.
// Web (SVG) and mobile (react-native-svg) both draw from these, so they match.

// ---------- Which charts to draw ----------

const CHART_TYPES = [
  {
    id: 'wind',
    title: 'Wind',
    kind: 'speed',
    decimals: 0,
    fromZero: true,
    lines: [
      { key: 'wind', label: 'Wind', field: 'windKts' },
      { key: 'gust', label: 'Gust', field: 'gustKts' },
    ],
  },
  {
    id: 'waves',
    title: 'Wave height',
    kind: 'height',
    decimals: 1,
    fromZero: true,
    lines: [{ key: 'waves', label: 'Waves', field: 'waveHeightFt' }],
  },
  {
    id: 'pressure',
    title: 'Pressure',
    kind: 'pressure',
    decimals: 1,
    fromZero: false,
    lines: [{ key: 'pressure', label: 'Pressure', field: 'pressureHpa' }],
  },
];

// Turn a stored value (kts, ft or hPa) into the person's chosen unit
function convertValue(kind, value, units) {
  if (kind === 'speed') return speedInUnits(value, units);
  if (kind === 'height') return heightInUnits(value, units);
  return value;
}

function chartUnitLabel(kind, units) {
  if (kind === 'speed') return unitLabel('speed', units.speed);
  if (kind === 'height') return unitLabel('height', units.height);
  return 'hPa';
}

// Charts for a site's history (newest first). A chart is only included when
// one of its lines has at least 2 readings — one dot isn't a trend.
export function buildSiteCharts(history, units = DEFAULT_UNITS) {
  const readings = sortOldestFirst(history ?? []);
  const times = readings.map(reading => new Date(reading.observedAt));

  return CHART_TYPES.map(type => ({
    id: type.id,
    title: type.title,
    unit: chartUnitLabel(type.kind, units),
    decimals: type.decimals,
    fromZero: type.fromZero,
    times,
    lines: type.lines.map(line => ({
      key: line.key,
      label: line.label,
      values: readings.map((reading, i) => ({
        time: times[i],
        value:
          reading[line.field] == null ? null : convertValue(type.kind, reading[line.field], units),
      })),
    })),
  })).filter(hasEnoughReadings);
}

function sortOldestFirst(history) {
  return [...history].sort((a, b) => new Date(a.observedAt) - new Date(b.observedAt));
}

function hasEnoughReadings(chart) {
  return chart.lines.some(line => presentValues(line).length >= 2);
}

// The readings in a line that aren't missing
function presentValues(line) {
  return line.values.filter(point => point.value != null);
}

// ---------- Screen-reader summary ----------

// 'Wind over the last 12 hours: wind 10 to 17 kts, gust 15 to 25 kts.'
export function describeChart(chart) {
  const parts = chart.lines
    .map(line => describeRange(line, chart))
    .filter(Boolean)
    .join(', ');
  return `${chart.title} over the last 12 hours: ${parts}.`;
}

function describeRange(line, chart) {
  const values = presentValues(line).map(point => roundTo(point.value, chart.decimals));
  if (values.length === 0) return '';
  const low = Math.min(...values);
  const high = Math.max(...values);
  const range = low === high ? `${low}` : `${low} to ${high}`;
  return `${line.label.toLowerCase()} ${range} ${chart.unit}`;
}

// ---------- Drawing maths ----------

// Room around the plot for the value labels (left) and time labels (bottom)
const PADDING = { top: 12, right: 14, bottom: 26, left: 42 };
const Y_INTERVALS = 3;

// Positions for one chart at a given pixel size: a path per line (broken at
// missing readings), dots for each reading, and the axis labels
export function layoutChart(chart, { width, height }) {
  const plot = {
    left: PADDING.left,
    right: width - PADDING.right,
    top: PADDING.top,
    bottom: height - PADDING.bottom,
  };
  const xForTime = buildTimeScale(chart.times, plot);
  const { ticks, yForValue } = buildValueScale(chart, plot);

  return {
    width,
    height,
    plot,
    lines: chart.lines.map(line => layoutLine(line, xForTime, yForValue)),
    xTicks: buildTimeTicks(chart.times, xForTime),
    yTicks: ticks.map(value => ({ y: yForValue(value), label: String(roundTo(value, 1)) })),
  };
}

// Earliest reading on the left edge, latest on the right
function buildTimeScale(times, plot) {
  const startMs = times[0].getTime();
  const spanMs = times.at(-1).getTime() - startMs || 1; // avoid dividing by zero
  return time => plot.left + ((time.getTime() - startMs) / spanMs) * (plot.right - plot.left);
}

// Higher values nearer the top, on a scale with round tick values
function buildValueScale(chart, plot) {
  const values = chart.lines.flatMap(line => presentValues(line).map(point => point.value));
  const low = chart.fromZero ? 0 : Math.min(...values);
  const ticks = niceTicks(low, Math.max(...values));
  const bottomValue = ticks[0];
  const topValue = ticks.at(-1);
  const yForValue = value =>
    plot.top + (1 - (value - bottomValue) / (topValue - bottomValue)) * (plot.bottom - plot.top);
  return { ticks, yForValue };
}

// Round tick values that cover low..high in about 3 steps, e.g. 0, 10, 20, 30
function niceTicks(low, high) {
  const top = high > low ? high : low + 1; // a flat line still needs some height
  const step = niceStep((top - low) / Y_INTERVALS);
  const first = Math.floor(low / step) * step;
  const last = Math.ceil(top / step) * step;
  const ticks = [];
  for (let value = first; value <= last + step / 2; value += step) {
    ticks.push(roundTo(value, 6)); // tidy floating-point leftovers like 0.30000000004
  }
  return ticks;
}

// The nearest 1, 2, 5 or 10 (times a power of ten) at or above a raw step
function niceStep(rawStep) {
  const power = 10 ** Math.floor(Math.log10(rawStep));
  const fraction = rawStep / power;
  if (fraction <= 1) return power;
  if (fraction <= 2) return 2 * power;
  if (fraction <= 5) return 5 * power;
  return 10 * power;
}

// A missing reading starts a new piece of the line, so gaps stay gaps
function layoutLine(line, xForTime, yForValue) {
  const points = [];
  const pathParts = [];
  let previousWasMissing = true;

  for (const { time, value } of line.values) {
    if (value == null) {
      previousWasMissing = true;
      continue;
    }
    const point = { x: roundTo(xForTime(time), 1), y: roundTo(yForValue(value), 1), value, time };
    // 'M' moves the pen without drawing; 'L' draws a line from the last point
    pathParts.push(`${previousWasMissing ? 'M' : 'L'}${point.x},${point.y}`);
    points.push(point);
    previousWasMissing = false;
  }

  return { key: line.key, label: line.label, path: pathParts.join(' '), points };
}

// Time labels at the start, middle and end, in Pacific time
function buildTimeTicks(times, xForTime) {
  const indexes = [...new Set([0, Math.floor((times.length - 1) / 2), times.length - 1])];
  // Edge labels hang inwards so they aren't cut off
  const anchors = indexes.length === 3 ? ['start', 'middle', 'end'] : ['start', 'end'];
  return indexes.map((index, i) => ({
    x: xForTime(times[index]),
    label: formatTime(times[index]),
    anchor: anchors[i],
  }));
}

function roundTo(value, decimals) {
  return Number(value.toFixed(decimals));
}

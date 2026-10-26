import { test, expect } from 'vitest';
import { DEFAULT_UNITS, buildSiteCharts, layoutChart, describeChart } from '../src/index.js';

const METRIC = { speed: 'kmh', height: 'm', temperature: 'c', distance: 'km' };

// One hourly reading; hoursAgo 0 is 1 PM PDT on 25 Oct 2026
function reading(hoursAgo, values) {
  return {
    observedAt: new Date(Date.UTC(2026, 9, 25, 20 - hoursAgo)),
    windKts: null,
    gustKts: null,
    waveHeightFt: null,
    pressureHpa: null,
    ...values,
  };
}

// Newest first, the order fetchSiteHistory returns
const LIGHTHOUSE_HISTORY = [
  reading(0, { windKts: 17, gustKts: 25, pressureHpa: 1007.5 }),
  reading(1, { windKts: 14, gustKts: null, pressureHpa: 1008 }),
  reading(2, { windKts: null, gustKts: 19, pressureHpa: 1009 }),
  reading(3, { windKts: 10, gustKts: 15, pressureHpa: 1010 }),
];

const BUOY_HISTORY = [
  reading(0, { windKts: 8, gustKts: 10, waveHeightFt: 3.3 }),
  reading(1, { windKts: 6, gustKts: 8, waveHeightFt: 1.6 }),
];

test('builds wind and pressure charts, oldest reading first, skipping waves without data', () => {
  const charts = buildSiteCharts(LIGHTHOUSE_HISTORY, DEFAULT_UNITS);
  expect(charts.map(chart => chart.id)).toEqual(['wind', 'pressure']);

  const [wind] = charts;
  expect(wind.unit).toBe('kts');
  expect(wind.lines.map(line => line.label)).toEqual(['Wind', 'Gust']);
  expect(wind.lines[0].values.map(point => point.value)).toEqual([10, null, 14, 17]);
  expect(wind.lines[1].values.map(point => point.value)).toEqual([15, 19, null, 25]);
});

test('converts values to the chosen units', () => {
  const [wind, waves] = buildSiteCharts(BUOY_HISTORY, METRIC);
  expect(wind.unit).toBe('km/h');
  expect(wind.lines[0].values[1].value).toBeCloseTo(8 * 1.852, 5);
  expect(waves.id).toBe('waves');
  expect(waves.unit).toBe('m');
  expect(waves.lines[0].values[1].value).toBeCloseTo(1.006, 3);
});

test('gives no charts when there are fewer than 2 readings', () => {
  expect(buildSiteCharts([LIGHTHOUSE_HISTORY[0]], DEFAULT_UNITS)).toEqual([]);
  expect(buildSiteCharts([], DEFAULT_UNITS)).toEqual([]);
});

test('layoutChart breaks the line at missing readings instead of drawing NaN', () => {
  const [wind] = buildSiteCharts(LIGHTHOUSE_HISTORY, DEFAULT_UNITS);
  const layout = layoutChart(wind, { width: 300, height: 160 });
  const windLine = layout.lines[0];

  expect(windLine.path).not.toContain('NaN');
  // Two separate pieces: the 10 kts reading alone, then 14 → 17 kts
  expect(windLine.path.match(/M/g)).toHaveLength(2);
  expect(windLine.points).toHaveLength(3);
  expect(windLine.points.every(point => Number.isFinite(point.x + point.y))).toBe(true);
});

test('layoutChart places time from left to right and higher values nearer the top', () => {
  const [wind] = buildSiteCharts(LIGHTHOUSE_HISTORY, DEFAULT_UNITS);
  const layout = layoutChart(wind, { width: 300, height: 160 });
  const [oldest, , newest] = layout.lines[0].points;
  expect(newest.x).toBeGreaterThan(oldest.x);
  expect(newest.y).toBeLessThan(oldest.y); // 17 kts is drawn above 10 kts
});

test('layoutChart gives round y-axis ticks from zero and Pacific time labels', () => {
  const [wind] = buildSiteCharts(LIGHTHOUSE_HISTORY, DEFAULT_UNITS);
  const layout = layoutChart(wind, { width: 300, height: 160 });
  expect(layout.yTicks.map(tick => tick.label)).toEqual(['0', '10', '20', '30']);
  expect(layout.xTicks.map(tick => tick.label)).toEqual(['10:00 AM', '11:00 AM', '1:00 PM']);
});

test('layoutChart copes with a flat line', () => {
  const flat = [reading(0, { pressureHpa: 1010 }), reading(1, { pressureHpa: 1010 })];
  const [pressure] = buildSiteCharts(flat, DEFAULT_UNITS);
  const layout = layoutChart(pressure, { width: 300, height: 160 });
  expect(layout.lines[0].path).not.toContain('NaN');
  expect(layout.yTicks.length).toBeGreaterThan(1);
});

test('describeChart summarises each line for screen readers', () => {
  const [wind] = buildSiteCharts(LIGHTHOUSE_HISTORY, DEFAULT_UNITS);
  expect(describeChart(wind)).toBe(
    'Wind over the last 12 hours: wind 10 to 17 kts, gust 15 to 25 kts.'
  );
});

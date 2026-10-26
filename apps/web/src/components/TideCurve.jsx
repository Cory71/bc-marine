import { useEffect, useState } from 'react';
import { formatTime, getNextTideEvent, formatHeight, DEFAULT_UNITS } from '@bc-marine/shared';

// Space around the curve for event labels (top/bottom) and the hour axis
const PADDING = { top: 30, right: 16, bottom: 44, left: 16 };
const FALLBACK_WIDTH = 800;

// Today's tide as a smooth curve, with high/low markers and a "Now" line.
// Draws at the container's real pixel width so text stays readable on phones.
export default function TideCurve({
  tides,
  events = [],
  width,
  height = 240,
  now = new Date(),
  units = DEFAULT_UNITS,
}) {
  const [containerRef, measuredWidth] = useContainerWidth(FALLBACK_WIDTH);
  if (!tides || tides.length < 2) return null;

  const chartWidth = width ?? measuredWidth;
  const scale = buildScale(tides, events, chartWidth, height);
  const points = tides.map(tide => scale.toPoint(tide));
  const curvePath = buildCurvePath(points);
  const areaPath = `${curvePath} L${points.at(-1).x},${scale.baseY} L${points[0].x},${scale.baseY} Z`;
  const visibleEvents = events.filter(event => scale.isInRange(event.time));
  const nowPoint = scale.isInRange(now) ? findPointAtTime(points, scale.xForTime(now)) : null;

  return (
    <div ref={containerRef} className="tide-curve">
      <svg
        width={chartWidth}
        height={height}
        viewBox={`0 0 ${chartWidth} ${height}`}
        role="img"
        aria-label={describeTides(events, now, units)}
      >
        <path d={areaPath} fill="rgba(126, 206, 244, 0.12)" />
        <path d={curvePath} fill="none" stroke="var(--color-accent)" strokeWidth="2.5" />

        <HourAxis points={points} y={height - 12} chartWidth={chartWidth} />
        {visibleEvents.map(event => (
          <EventMarker
            key={event.time.toString()}
            event={event}
            point={scale.toPoint(event)}
            chartWidth={chartWidth}
            units={units}
          />
        ))}
        {nowPoint && (
          <NowMarker
            point={nowPoint}
            top={PADDING.top - 10}
            bottom={scale.baseY}
            nearbyEvent={findNearbyEvent(visibleEvents, nowPoint, scale)}
          />
        )}
      </svg>
    </div>
  );
}

// Map times to x and heights to y. Events are included so their dots fit on the chart.
function buildScale(tides, events, width, height) {
  const startMs = new Date(tides[0].time).getTime();
  const endMs = new Date(tides.at(-1).time).getTime();
  const heights = [...tides, ...events].map(item => item.heightFt);
  const minFt = Math.min(...heights);
  const range = Math.max(...heights) - minFt || 1; // avoid dividing by zero on a flat tide
  const plotWidth = width - PADDING.left - PADDING.right;
  const plotHeight = height - PADDING.top - PADDING.bottom;

  const xForTime = time =>
    PADDING.left + ((new Date(time) - startMs) / (endMs - startMs)) * plotWidth;
  const yForHeight = heightFt => PADDING.top + (1 - (heightFt - minFt) / range) * plotHeight;

  return {
    baseY: PADDING.top + plotHeight,
    xForTime,
    isInRange: time => new Date(time) >= startMs && new Date(time) <= endMs,
    toPoint: item => ({ ...item, x: xForTime(item.time), y: yForHeight(item.heightFt) }),
  };
}

// Smooth path through the points using cubic bezier segments (Catmull-Rom style).
// Each control point follows the slope between the neighbouring readings, so the
// curve flows through every reading instead of flattening at each one.
function buildCurvePath(points) {
  return points.reduce((path, point, i) => {
    if (i === 0) return `M${point.x},${point.y}`;
    const before = points[i - 2] ?? points[i - 1];
    const start = points[i - 1];
    const after = points[i + 1] ?? point;
    const control1 = {
      x: start.x + (point.x - before.x) / 6,
      y: start.y + (point.y - before.y) / 6,
    };
    const control2 = { x: point.x - (after.x - start.x) / 6, y: point.y - (after.y - start.y) / 6 };
    return `${path} C${control1.x},${control1.y} ${control2.x},${control2.y} ${point.x},${point.y}`;
  }, '');
}

// Position on the curve at a given x, blending the two readings either side of it
function findPointAtTime(points, x) {
  const nextIndex = points.findIndex(point => point.x >= x);
  if (nextIndex <= 0) return points[Math.max(nextIndex, 0)];
  const previous = points[nextIndex - 1];
  const next = points[nextIndex];
  const progress = (x - previous.x) / (next.x - previous.x);
  return { x, y: previous.y + (next.y - previous.y) * progress };
}

// Screen-reader summary: "Tide curve for today. Next high 8.4 ft at 1:59 PM, next low 3 ft at 8:55 PM."
function describeTides(events, now, units) {
  const upcoming = [
    ['high', getNextTideEvent(events, 'HIGH', now)],
    ['low', getNextTideEvent(events, 'LOW', now)],
  ]
    .filter(([, event]) => event)
    .map(
      ([type, event]) =>
        `next ${type} ${formatHeight(event.heightFt, units)} at ${formatTime(event.time)}`
    );

  if (upcoming.length === 0) return 'Tide curve for today.';
  const summary = upcoming.join(', ');
  return `Tide curve for today. ${summary[0].toUpperCase()}${summary.slice(1)}.`;
}

// Hour labels every 6 readings: "12 AM", "6 AM", "12 PM", "6 PM"
function HourAxis({ points, y, chartWidth }) {
  return points
    .filter((_, i) => i % 6 === 0)
    .map(point => (
      <text
        key={point.x}
        x={point.x}
        y={y}
        className="tide-curve__axis"
        textAnchor={getLabelAnchor(point.x, chartWidth)}
      >
        {formatTime(point.time).replace(':00', '')}
      </text>
    ));
}

// High tides are labelled above the dot, low tides below
function EventMarker({ event, point, chartWidth, units }) {
  const isHigh = event.type === 'HIGH';
  const labelY = isHigh ? point.y - 10 : point.y + 18;
  return (
    <g className={isHigh ? 'tide-curve__high' : 'tide-curve__low'}>
      <circle cx={point.x} cy={point.y} r="4" />
      <text
        x={point.x}
        y={labelY}
        textAnchor={getLabelAnchor(point.x, chartWidth)}
        className="tide-curve__label"
      >
        {formatHeight(event.heightFt, units)} · {formatTime(event.time)}
      </text>
    </g>
  );
}

// Dashed line and dot at the current time. The label sits beside the dot, but moves
// out of the way of a nearby high (labelled above) or low (labelled below).
function NowMarker({ point, top, bottom, nearbyEvent }) {
  let labelY = point.y + 4;
  if (nearbyEvent?.type === 'HIGH') labelY = point.y + 20;
  if (nearbyEvent?.type === 'LOW') labelY = point.y - 12;

  return (
    <g className="tide-curve__now">
      <line x1={point.x} y1={top} x2={point.x} y2={bottom} strokeDasharray="4 4" />
      <circle cx={point.x} cy={point.y} r="5" />
      <text x={point.x + 9} y={labelY} className="tide-curve__label">
        Now
      </text>
    </g>
  );
}

// The high/low event whose label could collide with the "Now" label, if any
function findNearbyEvent(events, nowPoint, scale) {
  const LABEL_ROOM_PX = 90;
  return events.find(event => Math.abs(scale.xForTime(event.time) - nowPoint.x) < LABEL_ROOM_PX);
}

// Keep labels near the chart's edges from being cut off
function getLabelAnchor(x, chartWidth) {
  const EDGE_ROOM = 60;
  if (x < EDGE_ROOM) return 'start';
  if (x > chartWidth - EDGE_ROOM) return 'end';
  return 'middle';
}

// Track an element's width so the chart can redraw when the layout changes.
// Returns a callback ref: the element may appear later (once tide data arrives).
function useContainerWidth(fallbackWidth) {
  const [element, setElement] = useState(null);
  const [width, setWidth] = useState(fallbackWidth);

  useEffect(() => {
    if (!element || typeof ResizeObserver === 'undefined') return; // e.g. in tests
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return [setElement, width];
}

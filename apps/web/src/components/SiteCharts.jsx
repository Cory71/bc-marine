import { buildSiteCharts, layoutChart, describeChart, DEFAULT_UNITS } from '@bc-marine/shared';
import { useContainerWidth } from './TideCurve.jsx';

const FALLBACK_WIDTH = 600;
const CHART_HEIGHT = 170;

// Line charts of a lighthouse or buoy's last 12 hours: wind and gusts, waves
// (buoys only) and pressure, in the person's chosen units
export default function SiteCharts({ history, units = DEFAULT_UNITS }) {
  const charts = buildSiteCharts(history, units);
  if (charts.length === 0) {
    return <p className="card__note">Not enough readings yet to chart.</p>;
  }

  return (
    <div className="site-charts">
      {charts.map(chart => (
        <SiteChart key={chart.id} chart={chart} />
      ))}
    </div>
  );
}

// One chart: a title with a legend, then the plot.
// Draws at the container's real pixel width so text stays readable on phones.
function SiteChart({ chart }) {
  const [containerRef, measuredWidth] = useContainerWidth(FALLBACK_WIDTH);
  const layout = layoutChart(chart, { width: measuredWidth, height: CHART_HEIGHT });

  return (
    <figure className="site-chart">
      <figcaption className="site-chart__header">
        <span className="site-chart__title">
          {chart.title} ({chart.unit})
        </span>
        {chart.lines.length > 1 && <Legend lines={chart.lines} />}
      </figcaption>
      <div ref={containerRef} className="site-chart__plot">
        <svg
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          role="img"
          aria-label={describeChart(chart)}
        >
          <ValueAxis layout={layout} />
          <TimeAxis layout={layout} />
          {layout.lines.map(line => (
            <ChartLine key={line.key} line={line} />
          ))}
        </svg>
      </div>
    </figure>
  );
}

// Coloured keys for charts with more than one line (wind and gust)
function Legend({ lines }) {
  return (
    <span className="site-chart__legend" aria-hidden="true">
      {lines.map(line => (
        <span key={line.key} className={`site-chart__key site-chart__key--${line.key}`}>
          {line.label}
        </span>
      ))}
    </span>
  );
}

// Faint gridlines with their values down the left side
function ValueAxis({ layout }) {
  return layout.yTicks.map(tick => (
    <g key={tick.label}>
      <line
        x1={layout.plot.left}
        x2={layout.plot.right}
        y1={tick.y}
        y2={tick.y}
        className="site-chart__grid"
      />
      <text x={layout.plot.left - 6} y={tick.y + 4} textAnchor="end" className="site-chart__axis">
        {tick.label}
      </text>
    </g>
  ));
}

// Start, middle and end times along the bottom, in Pacific time
function TimeAxis({ layout }) {
  return layout.xTicks.map(tick => (
    <text
      key={tick.label}
      x={tick.x}
      y={layout.height - 6}
      textAnchor={tick.anchor}
      className="site-chart__axis"
    >
      {tick.label}
    </text>
  ));
}

// The line itself, plus a dot on every reading (so a lone reading between gaps still shows)
function ChartLine({ line }) {
  return (
    <g className={`site-chart__line site-chart__line--${line.key}`}>
      <path d={line.path} fill="none" />
      {line.points.map(point => (
        <circle key={point.x} cx={point.x} cy={point.y} r="3" />
      ))}
    </g>
  );
}

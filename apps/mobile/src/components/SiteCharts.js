import { useState } from 'react';
import { View, Text } from 'react-native';
import Svg, { G, Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { buildSiteCharts, layoutChart, describeChart, DEFAULT_UNITS } from '@bc-marine/shared';
import { useColors, makeStyles } from '../theme';

const CHART_HEIGHT = 150;

// Colours for each line; gusts are also dashed so they differ by more than colour
function lineStyles(COLORS) {
  return {
    wind: { color: COLORS.accent, width: 2.5 },
    gust: { color: COLORS.warning, width: 1.5, dash: '5,4' },
    waves: { color: COLORS.accent, width: 2.5 },
    pressure: { color: COLORS.textSecondary, width: 2.5 },
  };
}

// Line charts of a lighthouse or buoy's last 12 hours: wind and gusts, waves
// (buoys only) and pressure, in the person's chosen units
export default function SiteCharts({ history, units = DEFAULT_UNITS }) {
  const styles = useStyles();
  const charts = buildSiteCharts(history, units);
  if (charts.length === 0) {
    return <Text style={styles.note}>Not enough readings yet to chart.</Text>;
  }
  return charts.map(chart => <SiteChart key={chart.id} chart={chart} />);
}

// One chart: a title with a legend, then the plot at the card's real width
function SiteChart({ chart }) {
  const styles = useStyles();
  const [width, setWidth] = useState(0);
  const layout = width > 0 ? layoutChart(chart, { width, height: CHART_HEIGHT }) : null;

  return (
    <View style={styles.chart}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {chart.title} ({chart.unit})
        </Text>
        {chart.lines.length > 1 && <Legend lines={chart.lines} />}
      </View>
      <View
        style={{ height: CHART_HEIGHT }}
        onLayout={event => setWidth(Math.floor(event.nativeEvent.layout.width))}
        accessible
        accessibilityRole="image"
        accessibilityLabel={describeChart(chart)}
      >
        {layout && (
          <Svg width={layout.width} height={layout.height}>
            <ValueAxis layout={layout} />
            <TimeAxis layout={layout} />
            {layout.lines.map(line => (
              <ChartLine key={line.key} line={line} />
            ))}
          </Svg>
        )}
      </View>
    </View>
  );
}

// Coloured keys for charts with more than one line (wind and gust)
function Legend({ lines }) {
  const styles = useStyles();
  const LINE_STYLES = lineStyles(useColors());
  return (
    <View style={styles.legend}>
      {lines.map(line => (
        <View key={line.key} style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: LINE_STYLES[line.key].color }]} />
          <Text style={styles.legendText}>{line.label}</Text>
        </View>
      ))}
    </View>
  );
}

// Faint gridlines with their values down the left side
function ValueAxis({ layout }) {
  const COLORS = useColors();
  return layout.yTicks.map(tick => (
    <G key={tick.label}>
      <Line
        x1={layout.plot.left}
        x2={layout.plot.right}
        y1={tick.y}
        y2={tick.y}
        stroke={COLORS.cardBorder}
        strokeWidth={1}
      />
      <SvgText x={layout.plot.left - 6} y={tick.y + 3} textAnchor="end" fill={COLORS.textSecondary} fontSize={9}>
        {tick.label}
      </SvgText>
    </G>
  ));
}

// Start, middle and end times along the bottom, in Pacific time
function TimeAxis({ layout }) {
  const COLORS = useColors();
  return layout.xTicks.map(tick => (
    <SvgText
      key={tick.label}
      x={tick.x}
      y={layout.height - 6}
      textAnchor={tick.anchor}
      fill={COLORS.textSecondary}
      fontSize={9}
    >
      {tick.label}
    </SvgText>
  ));
}

// The line itself, plus a dot on every reading (so a lone reading between gaps still shows)
function ChartLine({ line }) {
  const style = lineStyles(useColors())[line.key];
  return (
    <G>
      {line.path !== '' && (
        <Path
          d={line.path}
          fill="none"
          stroke={style.color}
          strokeWidth={style.width}
          strokeDasharray={style.dash}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {line.points.map(point => (
        <Circle key={point.x} cx={point.x} cy={point.y} r={2.5} fill={style.color} />
      ))}
    </G>
  );
}

const useStyles = makeStyles(COLORS => ({
  chart: { marginBottom: 12 },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: { color: COLORS.textPrimary, fontSize: 12, fontWeight: 'bold' },
  legend: { flexDirection: 'row', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendSwatch: { width: 12, height: 3, borderRadius: 2 },
  legendText: { color: COLORS.textSecondary, fontSize: 10 },
  note: { color: COLORS.textSecondary, fontSize: 12 },
}));

import { View } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../utils/constants';
import { formatTime } from '../utils/units';

// Draws a smooth tide curve from an array of { time, heightFt } hourly points
export default function TideCurve({ tides, width = 300, height = 80 }) {
  if (!tides || tides.length < 2) return null;

  const maxFt = Math.max(...tides.map(t => t.heightFt));
  const minFt = Math.min(...tides.map(t => t.heightFt));
  const range = maxFt - minFt || 1;

  // Map tide data to SVG x/y coordinates
  const points = tides.map((t, i) => ({
    x: (i / (tides.length - 1)) * width,
    y: height - ((t.heightFt - minFt) / range) * (height - 10) - 5,
    ...t,
  }));

  // Build a smooth SVG path using cubic bezier curves
  const d = points.reduce((acc, p, i) => {
    if (i === 0) return `M${p.x},${p.y}`;
    const prev = points[i - 1];
    const cpX = (prev.x + p.x) / 2;
    return `${acc} C${cpX},${prev.y} ${cpX},${p.y} ${p.x},${p.y}`;
  }, '');

  const fillD = `${d} L${width},${height} L0,${height} Z`;

  // Find the closest hourly point to now
  const now = Date.now();
  const currentPoint = points.reduce((closest, p) =>
    Math.abs(new Date(p.time) - now) < Math.abs(new Date(closest.time) - now) ? p : closest
  , points[0]);

  return (
    <View>
      <Svg width={width} height={height}>
        <Path d={fillD} fill="rgba(126,206,244,0.15)" />
        <Path d={d} fill="none" stroke={COLORS.accent} strokeWidth={2} />
        <Circle cx={currentPoint.x} cy={currentPoint.y} r={4} fill={COLORS.safe} />
        <Line x1={currentPoint.x} y1={0} x2={currentPoint.x} y2={height} stroke="rgba(77,204,136,0.4)" strokeWidth={1} strokeDasharray="3,3" />
        <SvgText x={currentPoint.x + 4} y={currentPoint.y - 6} fill={COLORS.safe} fontSize={8}>Now</SvgText>
      </Svg>
    </View>
  );
}

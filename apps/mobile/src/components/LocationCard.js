import { View, Text, TouchableOpacity } from 'react-native';
import { useColors, makeStyles } from '../theme';

function degreesToCompass(deg) {
  if (deg == null) return '--';
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

export default function LocationCard({ station, weatherData, tideData, warnings, isActive, onPress }) {
  const styles = useStyles();
  const COLORS = useColors();
  const wind = weatherData?.windSpeedKts?.toFixed(0);
  const windDir = weatherData?.windDirectionDeg;
  const waves = weatherData?.waveHeightFt;
  const tide = tideData?.heightFt;
  const hasWarning = warnings && warnings.length > 0;

  return (
    <TouchableOpacity style={[styles.card, isActive && styles.activeCard]} onPress={onPress}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.name, isActive && { color: COLORS.textPrimary }]}>{station.name}</Text>
          <Text style={styles.meta}>{station.region}</Text>
        </View>
        {isActive && <Text style={styles.activeLabel}>● Active</Text>}
      </View>
      <View style={styles.row}>
        <View style={[styles.col, hasWarning && styles.warningCol]}>
          <Text style={[styles.colLabel, hasWarning && { color: COLORS.warning }]}>Alert</Text>
          <Text style={[styles.colValue, hasWarning ? { color: COLORS.warning } : { color: COLORS.safe }]}>
            {hasWarning ? '⚠️ Active' : 'None'}
          </Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.colLabel}>Wind</Text>
          <Text style={styles.colValue}>{degreesToCompass(windDir)} {wind ?? '--'} kts</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.colLabel}>Waves</Text>
          <Text style={styles.colValue}>{waves ?? '--'} ft</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.colLabel}>Tide</Text>
          <Text style={styles.colValue}>{tide != null ? `${tide} ft` : '--'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const useStyles = makeStyles(COLORS => ({
  card: { marginHorizontal: 16, marginBottom: 8, backgroundColor: `rgba(${COLORS.accentRgb},0.06)`, borderWidth: 1, borderColor: `rgba(${COLORS.accentRgb},0.15)`, borderRadius: 10, padding: 10 },
  activeCard: { backgroundColor: `rgba(${COLORS.accentRgb},0.12)`, borderColor: `rgba(${COLORS.accentRgb},0.35)` },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  name: { color: COLORS.textSecondary, fontSize: 13, fontWeight: 'bold' },
  meta: { color: COLORS.textMuted, fontSize: 9, marginTop: 2 },
  activeLabel: { color: COLORS.safe, fontSize: 9, fontWeight: 'bold' },
  row: { flexDirection: 'row', gap: 6 },
  col: { flex: 1, backgroundColor: `rgba(${COLORS.accentRgb},0.08)`, borderRadius: 6, padding: 5, alignItems: 'center' },
  warningCol: { backgroundColor: `rgba(${COLORS.warningRgb},0.15)`, borderWidth: 1, borderColor: `rgba(${COLORS.warningRgb},0.3)` },
  colLabel: { color: COLORS.accent, fontSize: 8, textTransform: 'uppercase' },
  colValue: { color: COLORS.textSecondary, fontSize: 10, fontWeight: 'bold', marginTop: 2, textAlign: 'center' },
}));

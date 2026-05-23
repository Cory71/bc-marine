import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { COLORS } from '../utils/constants';
import { formatTime } from '../utils/units';

function degreesToCompass(deg) {
  if (deg == null) return '--';
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

export default function CurrentsDetailScreen({ navigation }) {
  const { activeStation, weather } = useApp();

  const now = new Date();
  const current = weather.reduce((closest, h) =>
    Math.abs(new Date(h.time) - now) < Math.abs(new Date(closest.time) - now) ? h : closest
  , weather[0] ?? {});
  const upcoming = weather.filter(h => new Date(h.time) >= new Date(current.time)).slice(0, 8);

  // Determine flood/ebb by comparing speed to previous hour; null when no data
  const currentIdx = weather.findIndex(h => h.time === current.time);
  const prevSpeed = weather[currentIdx - 1]?.currentSpeedKts ?? null;
  const currentSpeed = current.currentSpeedKts ?? null;
  const phase = currentSpeed != null ? (currentSpeed >= (prevSpeed ?? 0) ? 'Flooding' : 'Ebbing') : null;

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>‹ Dashboard</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Tidal Currents</Text>
      <Text style={styles.subtitle}>📍 {activeStation.name}, BC · Open-Meteo</Text>

      <View style={styles.hero}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Speed</Text>
          <Text style={styles.statValue}>{current?.currentSpeedKts?.toFixed(1) ?? '--'} kts</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Direction</Text>
          <Text style={styles.statValue}>{degreesToCompass(current?.currentDirectionDeg)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Phase</Text>
          <Text style={[styles.statValue, { color: phase === 'Flooding' ? COLORS.safe : phase === 'Ebbing' ? COLORS.warning : COLORS.textMuted }]}>
            {phase ?? '--'}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Hourly Currents</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.col, { width: 60 }]}>TIME</Text>
          <Text style={styles.col}>SPEED</Text>
          <Text style={styles.col}>DIRECTION</Text>
        </View>
        {upcoming.map((hour, i) => (
          <View key={i} style={[styles.tableRow, i === 0 && styles.currentRow]}>
            <Text style={[styles.colText, { width: 60, color: i === 0 ? COLORS.safe : COLORS.textMuted }]}>
              {i === 0 ? 'Now' : formatTime(hour.time)}
            </Text>
            <Text style={[styles.colText, { fontWeight: i === 0 ? 'bold' : 'normal', color: i === 0 ? COLORS.textPrimary : COLORS.textSecondary }]}>
              {hour.currentSpeedKts?.toFixed(1) ?? '--'} kts
            </Text>
            <Text style={styles.colText}>{degreesToCompass(hour.currentDirectionDeg)}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  back: { padding: 16, paddingBottom: 4 },
  backText: { color: COLORS.accent, fontSize: 13 },
  title: { color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold', paddingHorizontal: 16 },
  subtitle: { color: COLORS.textMuted, fontSize: 10, paddingHorizontal: 16, marginBottom: 12 },
  hero: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 10 },
  statBox: { flex: 1, backgroundColor: 'rgba(126,206,244,0.1)', borderRadius: 8, padding: 10, alignItems: 'center' },
  statLabel: { color: COLORS.accent, fontSize: 9, textTransform: 'uppercase' },
  statValue: { color: COLORS.textPrimary, fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  card: { marginHorizontal: 16, marginBottom: 10, backgroundColor: 'rgba(126,206,244,0.06)', borderWidth: 1, borderColor: 'rgba(126,206,244,0.15)', borderRadius: 10, padding: 12 },
  cardLabel: { color: COLORS.accent, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  tableHeader: { flexDirection: 'row', marginBottom: 4 },
  col: { flex: 1, color: COLORS.textMuted, fontSize: 9, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: 'rgba(126,206,244,0.08)' },
  currentRow: { backgroundColor: 'rgba(77,204,136,0.05)', borderRadius: 4 },
  colText: { flex: 1, color: COLORS.textSecondary, fontSize: 10 },
});

import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { COLORS } from '../utils/constants';
import { formatTime } from '../utils/units';

// 16-point compass for more precise wind/swell direction
function degreesToCompass(deg) {
  if (deg == null) return '--';
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

export default function WeatherDetailScreen({ navigation }) {
  const { activeStation, weather } = useApp();

  const now = new Date();

  // Graceful fallback when Open-Meteo returned no hourly weather data
  if (!weather || weather.length === 0) {
    return (
      <ScrollView style={styles.container}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Wind & Weather</Text>
        <Text style={styles.subtitle}>📍 {activeStation.name}, BC · Open-Meteo</Text>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No weather data available for this station.</Text>
          <Text style={styles.emptySub}>Pull down on the Dashboard to refresh.</Text>
        </View>
      </ScrollView>
    );
  }

  const current = weather.reduce((closest, h) =>
    Math.abs(new Date(h.time) - now) < Math.abs(new Date(closest.time) - now) ? h : closest
  , weather[0] ?? {});
  const upcoming = weather.filter(h => new Date(h.time) >= new Date(current.time)).slice(0, 8);

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>‹ Dashboard</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Wind & Weather</Text>
      <Text style={styles.subtitle}>📍 {activeStation.name}, BC · Open-Meteo</Text>

      {/* Current conditions */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Current Conditions</Text>
        <View style={styles.row}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Wind</Text>
            <Text style={styles.statValue}>{degreesToCompass(current?.windDirectionDeg)} {current?.windSpeedKts?.toFixed(0) ?? '--'} kts</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Waves</Text>
            <Text style={styles.statValue}>{current?.waveHeightFt ?? '--'} ft</Text>
            <Text style={styles.statSub}>{current?.wavePeriodS?.toFixed(0) ?? '--'} s period</Text>
          </View>
        </View>
        <View style={[styles.row, { marginTop: 8 }]}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Swell</Text>
            <Text style={styles.statValue}>{current?.swellHeightFt ?? '--'} ft</Text>
            <Text style={styles.statSub}>{degreesToCompass(current?.swellDirectionDeg)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Visibility</Text>
            <Text style={styles.statValue}>{current?.visibilityKm?.toFixed(0) ?? '--'} km</Text>
          </View>
        </View>
      </View>

      {/* Hourly breakdown */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Hourly Breakdown</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.col, { width: 50 }]}>TIME</Text>
          <Text style={styles.col}>WIND</Text>
          <Text style={styles.col}>WAVES</Text>
          <Text style={styles.col}>VIS</Text>
        </View>
        {upcoming.map((hour, i) => (
          <View key={i} style={[styles.tableRow, i === 0 && styles.currentRow]}>
            <Text style={[styles.colText, { width: 50, color: i === 0 ? COLORS.safe : COLORS.textMuted }]}>
              {i === 0 ? 'Now' : formatTime(hour.time)}
            </Text>
            <Text style={[styles.colText, { fontWeight: i === 0 ? 'bold' : 'normal' }]}>
              {degreesToCompass(hour.windDirectionDeg)} {hour.windSpeedKts?.toFixed(0) ?? '--'}
            </Text>
            <Text style={[styles.colText, { fontWeight: i === 0 ? 'bold' : 'normal' }]}>
              {hour.waveHeightFt ?? '--'} ft
            </Text>
            <Text style={styles.colText}>{hour.visibilityKm?.toFixed(0) ?? '--'} km</Text>
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
  card: { marginHorizontal: 16, marginBottom: 10, backgroundColor: 'rgba(126,206,244,0.06)', borderWidth: 1, borderColor: 'rgba(126,206,244,0.15)', borderRadius: 10, padding: 12 },
  cardLabel: { color: COLORS.accent, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, backgroundColor: 'rgba(126,206,244,0.1)', borderRadius: 6, padding: 8, alignItems: 'center' },
  statLabel: { color: COLORS.accent, fontSize: 9, textTransform: 'uppercase' },
  statValue: { color: COLORS.textPrimary, fontSize: 13, fontWeight: 'bold', marginTop: 2, textAlign: 'center' },
  statSub: { color: COLORS.textSecondary, fontSize: 10, textAlign: 'center' },
  tableHeader: { flexDirection: 'row', marginBottom: 4 },
  col: { flex: 1, color: COLORS.textMuted, fontSize: 9, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: 'rgba(126,206,244,0.08)' },
  currentRow: { backgroundColor: 'rgba(77,204,136,0.05)', borderRadius: 4 },
  colText: { flex: 1, color: COLORS.textSecondary, fontSize: 10 },
  emptyCard: { marginHorizontal: 16, marginTop: 12, padding: 16, backgroundColor: 'rgba(126,206,244,0.06)', borderWidth: 1, borderColor: 'rgba(126,206,244,0.15)', borderRadius: 10, alignItems: 'center' },
  emptyText: { color: COLORS.textSecondary, fontSize: 13, textAlign: 'center' },
  emptySub: { color: COLORS.textMuted, fontSize: 11, marginTop: 6, textAlign: 'center' },
});

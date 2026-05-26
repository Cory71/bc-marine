import { View, Text, ScrollView, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { useApp } from '../context/AppContext';
import { COLORS } from '../utils/constants';
import { formatTime } from '../utils/units';
import TideCurve from '../components/TideCurve';

export default function TideDetailScreen({ navigation }) {
  const { activeStation, tides, tideEvents, weeklyTides } = useApp();
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - 56; // account for card padding and margins

  const now = new Date();

  // Graceful fallback when DFO returned no tide data for this station
  if (!tides || tides.length === 0) {
    return (
      <ScrollView style={styles.container}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Tide Chart</Text>
        <Text style={styles.subtitle}>📍 {activeStation.name}, BC · DFO</Text>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No tide data available for this station.</Text>
          <Text style={styles.emptySub}>Pull down on the Dashboard to refresh.</Text>
        </View>
      </ScrollView>
    );
  }

  const currentTide = tides.reduce((closest, h) =>
    Math.abs(new Date(h.time) - now) < Math.abs(new Date(closest.time) - now) ? h : closest
  , tides[0] ?? { heightFt: null });
  const nextEvent = tideEvents.find(e => new Date(e.time) > now);

  // Determine if tide is rising or falling based on recent hourly readings
  const nowIdx = tides.findIndex(h => new Date(h.time) >= now);
  const isRising = nowIdx > 0 ? tides[nowIdx]?.heightFt > tides[nowIdx - 1]?.heightFt : false;

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>‹ Dashboard</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Tide Chart</Text>
      <Text style={styles.subtitle}>📍 {activeStation.name}, BC · DFO</Text>

      {/* Current height hero */}
      <View style={styles.hero}>
        <View>
          <Text style={styles.heroLabel}>Current Height</Text>
          <Text style={styles.heroValue}>{currentTide?.heightFt ?? '--'} ft</Text>
          <Text style={[styles.heroSub, { color: isRising ? COLORS.safe : COLORS.accent }]}>
            {isRising ? '↑ Rising' : '↓ Falling'}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.heroLabel}>Next Event</Text>
          <Text style={styles.heroValue}>{nextEvent ? `${nextEvent.type} ${nextEvent.heightFt} ft` : '--'}</Text>
          <Text style={styles.heroSub}>{nextEvent ? formatTime(nextEvent.time) : ''}</Text>
        </View>
      </View>

      {/* Tide curve */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Today's Tide Curve</Text>
        <TideCurve tides={tides} width={chartWidth} height={80} />
      </View>

      {/* Today's high/low table */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Upcoming Events</Text>
        {tideEvents.filter(e => new Date(e.time) > new Date(Date.now() - 3600000)).map((event, i, arr) => (
          <View key={i} style={[styles.tableRow, i < arr.length - 1 && styles.rowBorder]}>
            <Text style={[styles.eventType, { color: event.type === 'HIGH' ? COLORS.warning : COLORS.accent }]}>
              {event.type === 'HIGH' ? '↑ HIGH' : '↓ LOW'}
            </Text>
            <Text style={styles.eventHeight}>{event.heightFt} ft</Text>
            <Text style={styles.eventTime}>{formatTime(event.time)}</Text>
          </View>
        ))}
      </View>

      {/* 7-day max tide bar chart */}
      {weeklyTides && weeklyTides.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>7-Day Max Tide Heights</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 90 }}>
            {weeklyTides.map((day, i) => {
              const maxAllDays = Math.max(...weeklyTides.map(d => d.maxFt));
              const barHeight = (day.maxFt / maxAllDays) * 56;
              return (
                <View key={i} style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 9 }}>{day.maxFt}</Text>
                  <View style={{ width: 20, height: barHeight, backgroundColor: i === 0 ? COLORS.accent : 'rgba(126,206,244,0.3)', borderRadius: 3, marginTop: 4 }} />
                  <Text style={{ color: i === 0 ? COLORS.accent : COLORS.textMuted, fontSize: 9, marginTop: 4 }}>{day.label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

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
  hero: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 16, backgroundColor: 'rgba(126,206,244,0.1)', borderWidth: 1, borderColor: 'rgba(126,206,244,0.25)', borderRadius: 10, padding: 12, marginBottom: 10 },
  heroLabel: { color: COLORS.accent, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  heroValue: { color: COLORS.textPrimary, fontSize: 26, fontWeight: 'bold' },
  heroSub: { color: COLORS.textSecondary, fontSize: 12 },
  card: { marginHorizontal: 16, marginBottom: 10, backgroundColor: 'rgba(126,206,244,0.06)', borderWidth: 1, borderColor: 'rgba(126,206,244,0.15)', borderRadius: 10, padding: 12 },
  cardLabel: { color: COLORS.accent, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(126,206,244,0.08)' },
  eventType: { fontSize: 11, fontWeight: 'bold', width: 60 },
  eventHeight: { color: COLORS.textPrimary, fontSize: 13, fontWeight: 'bold' },
  eventTime: { color: COLORS.textSecondary, fontSize: 12 },
  emptyCard: { marginHorizontal: 16, marginTop: 12, padding: 16, backgroundColor: 'rgba(126,206,244,0.06)', borderWidth: 1, borderColor: 'rgba(126,206,244,0.15)', borderRadius: 10, alignItems: 'center' },
  emptyText: { color: COLORS.textSecondary, fontSize: 13, textAlign: 'center' },
  emptySub: { color: COLORS.textMuted, fontSize: 11, marginTop: 6, textAlign: 'center' },
});

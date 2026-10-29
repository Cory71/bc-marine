import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useApp } from '../context/AppContext';
import SettingsButton from '../components/SettingsButton';
import { makeStyles } from '../theme';
import {
  formatWind,
  formatGust,
  formatWaves,
  formatWavePeriod,
  formatPressure,
  formatTemp,
  formatDistance,
  formatReadingAge,
  isOldReading,
} from '@bc-marine/shared';

const TYPE_LABELS = { lighthouse: 'LIGHTHOUSE', buoy: 'BUOY' };

// Live readings from the lighthouses and buoys nearest the active station
export default function ObservationsDetailScreen({ navigation }) {
  const styles = useStyles();
  const { activeStation, observations, units } = useApp();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ Dashboard</Text>
        </TouchableOpacity>
        <SettingsButton />
      </View>
      <Text style={styles.title}>Nearby Observations</Text>
      <Text style={styles.subtitle}>📍 {activeStation.name}, BC · Environment Canada, NOAA NDBC</Text>

      {observations.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No observation sites nearby.</Text>
          <Text style={styles.emptySub}>There's no lighthouse weather station or buoy within 100 km.</Text>
        </View>
      ) : (
        observations.map(observation => (
          // Tap a tile to see that site's last 12 hours
          <TouchableOpacity
            key={observation.site.id}
            onPress={() => navigation.navigate('SiteDetail', { siteId: observation.site.id })}
          >
            <ObservationTile {...observation} units={units} />
          </TouchableOpacity>
        ))
      )}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

// One site: name, type, distance, reading age, then every value it reports
function ObservationTile({ site, distanceKm, reading, units }) {
  const styles = useStyles();
  const isOld = reading && isOldReading(reading.observedAt);
  const isBuoy = site.type === 'buoy';

  return (
    <View style={[styles.tile, isOld && styles.oldTile]}>
      <View style={styles.tileTop}>
        <Text style={styles.siteName}>{site.name}</Text>
        <Text style={[styles.badge, isBuoy ? styles.buoyBadge : styles.lighthouseBadge]}>
          {TYPE_LABELS[site.type]}
        </Text>
      </View>
      <Text style={styles.meta}>
        {formatDistance(distanceKm, units)}
        {reading && ` · ${formatReadingAge(reading.observedAt)}`}
        {isOld && <Text style={styles.oldLabel}> · Old reading</Text>}
      </Text>
      {reading ? <ReadingStats reading={reading} units={units} /> : <Text style={styles.meta}>No recent report</Text>}
    </View>
  );
}

// Label/value pairs in two columns, skipping anything the site didn't report
export function ReadingStats({ reading, units }) {
  const styles = useStyles();
  const stats = [
    ['Wind', reading.windKts, formatWind(reading, units)],
    ['Gust (1 h)', reading.gustKts, formatGust(reading, units)],
    ['Waves', reading.waveHeightFt, formatWaves(reading, units)],
    ['Period', reading.wavePeriodS, formatWavePeriod(reading)],
    ['Water', reading.waterTempC, formatTemp(reading.waterTempC, units)],
    ['Pressure', reading.pressureHpa, formatPressure(reading, units)],
    ['Air', reading.airTempC, formatTemp(reading.airTempC, units)],
  ].filter(([, rawValue]) => rawValue != null);

  return (
    <View style={styles.stats}>
      {stats.map(([label, , text]) => (
        <View key={label} style={styles.stat}>
          <Text style={styles.statLabel}>{label}</Text>
          <Text style={styles.statValue}>{text}</Text>
        </View>
      ))}
    </View>
  );
}

const useStyles = makeStyles(COLORS => ({
  container: { flex: 1, backgroundColor: COLORS.background },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 10 },
  back: { padding: 16, paddingBottom: 4 },
  backText: { color: COLORS.accent, fontSize: 13 },
  title: { color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold', paddingHorizontal: 16 },
  subtitle: { color: COLORS.textMuted, fontSize: 10, paddingHorizontal: 16, marginBottom: 12 },
  tile: { marginHorizontal: 16, marginBottom: 10, backgroundColor: `rgba(${COLORS.accentRgb},0.06)`, borderWidth: 1, borderColor: `rgba(${COLORS.accentRgb},0.15)`, borderRadius: 10, padding: 12 },
  // Readings older than 3 hours fade back so they don't pass for current ones
  oldTile: { opacity: 0.6 },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  siteName: { color: COLORS.textPrimary, fontSize: 15, fontWeight: 'bold' },
  badge: { fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, overflow: 'hidden' },
  lighthouseBadge: { color: COLORS.accent, backgroundColor: `rgba(${COLORS.accentRgb},0.16)` },
  buoyBadge: { color: COLORS.safe, backgroundColor: `rgba(${COLORS.safeRgb},0.16)` },
  meta: { color: COLORS.textSecondary, fontSize: 11, marginTop: 4 },
  oldLabel: { color: COLORS.warning, fontWeight: 'bold' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  stat: { width: '50%', marginBottom: 8 },
  statLabel: { color: COLORS.accent, fontSize: 9, textTransform: 'uppercase' },
  statValue: { color: COLORS.textPrimary, fontSize: 16, fontWeight: 'bold', marginTop: 2 },
  emptyCard: { marginHorizontal: 16, marginTop: 12, padding: 16, backgroundColor: `rgba(${COLORS.accentRgb},0.06)`, borderWidth: 1, borderColor: `rgba(${COLORS.accentRgb},0.15)`, borderRadius: 10, alignItems: 'center' },
  emptyText: { color: COLORS.textSecondary, fontSize: 13, textAlign: 'center' },
  emptySub: { color: COLORS.textMuted, fontSize: 11, marginTop: 6, textAlign: 'center' },
}));

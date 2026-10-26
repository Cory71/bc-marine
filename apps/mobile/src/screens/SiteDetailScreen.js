import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useApp } from '../context/AppContext';
import SettingsButton from '../components/SettingsButton';
import { useColors, makeStyles } from '../theme';
import { ReadingStats } from './ObservationsDetailScreen';
import {
  findObservationSite,
  fetchSiteHistory,
  distanceKm,
  formatDistance,
  formatReadingAge,
  formatWind,
  formatGust,
  formatWaves,
  formatTime,
} from '@bc-marine/shared';

// One lighthouse or buoy: its latest reading and the last 12 hours, so you can
// see whether the wind is building, easing or holding steady
export default function SiteDetailScreen({ route, navigation }) {
  const styles = useStyles();
  const { activeStation, units } = useApp();
  const site = findObservationSite(route.params?.siteId);
  const { status, history } = useSiteHistory(site);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <SettingsButton />
      </View>

      {!site ? (
        <Message text="We couldn't find that lighthouse or buoy." />
      ) : (
        <>
          <Text style={styles.title}>
            {site.name} · {site.type === 'buoy' ? 'Buoy' : 'Lighthouse'}
          </Text>
          <Text style={styles.subtitle}>
            {formatDistance(distanceKm(activeStation.lat, activeStation.lon, site.lat, site.lon), units)} from{' '}
            {activeStation.name} · {site.type === 'buoy' ? 'NOAA NDBC' : 'Environment Canada'}
          </Text>
          <SiteReadings status={status} history={history} showWaves={site.type === 'buoy'} units={units} />
        </>
      )}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

function SiteReadings({ status, history, showWaves, units }) {
  const styles = useStyles();
  const COLORS = useColors();
  if (status === 'loading') return <ActivityIndicator color={COLORS.accent} style={{ marginTop: 24 }} />;
  if (status === 'failed') return <Message text="Readings unavailable. Try again shortly." />;
  const latest = history[0];
  if (!latest) return <Message text="No recent reports from this site." />;

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Latest · {formatReadingAge(latest.observedAt)}</Text>
        <ReadingStats reading={latest} units={units} />
      </View>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Last 12 Hours</Text>
        <View style={styles.tableRow}>
          <Text style={[styles.col, styles.timeCol]}>TIME</Text>
          <Text style={styles.col}>WIND</Text>
          <Text style={styles.col}>GUST</Text>
          {showWaves && <Text style={styles.col}>WAVES</Text>}
        </View>
        {history.map(reading => (
          <View key={reading.observedAt.toISOString()} style={styles.tableRow}>
            <Text style={[styles.colText, styles.timeCol]}>{formatTime(reading.observedAt)}</Text>
            <Text style={styles.colText}>{formatWind(reading, units)}</Text>
            <Text style={styles.colText}>{formatGust(reading, units)}</Text>
            {showWaves && <Text style={styles.colText}>{formatWaves(reading, units)}</Text>}
          </View>
        ))}
      </View>
    </>
  );
}

// Load a site's history; ignore a late answer for a site we've already left
function useSiteHistory(site) {
  const [result, setResult] = useState({ siteId: null, history: [], failed: false });

  useEffect(() => {
    if (!site) return undefined;
    let isCurrent = true;
    fetchSiteHistory(site)
      .then(history => isCurrent && setResult({ siteId: site.id, history, failed: false }))
      .catch(() => isCurrent && setResult({ siteId: site.id, history: [], failed: true }));
    return () => {
      isCurrent = false;
    };
  }, [site]);

  if (!site || result.siteId !== site.id) return { status: 'loading', history: [] };
  return { status: result.failed ? 'failed' : 'ready', history: result.history };
}

function Message({ text }) {
  const styles = useStyles();
  return (
    <View style={styles.card}>
      <Text style={styles.message}>{text}</Text>
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
  card: { marginHorizontal: 16, marginBottom: 10, backgroundColor: `rgba(${COLORS.accentRgb},0.06)`, borderWidth: 1, borderColor: `rgba(${COLORS.accentRgb},0.15)`, borderRadius: 10, padding: 12 },
  cardLabel: { color: COLORS.accent, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  tableRow: { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: `rgba(${COLORS.accentRgb},0.08)` },
  timeCol: { flex: 1.1 },
  col: { flex: 1, color: COLORS.textMuted, fontSize: 9, textTransform: 'uppercase' },
  colText: { flex: 1, color: COLORS.textSecondary, fontSize: 11 },
  message: { color: COLORS.textSecondary, fontSize: 13, textAlign: 'center' },
}));

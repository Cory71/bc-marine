import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useApp } from '../context/AppContext';
import SettingsButton from '../components/SettingsButton';
import SiteCharts from '../components/SiteCharts';
import { useSavedSites } from '../context/useSavedSites';
import { COLORS } from '../theme';
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
          <View style={styles.titleRow}>
            <Text style={styles.title}>
              {site.name} · {site.type === 'buoy' ? 'Buoy' : 'Lighthouse'}
            </Text>
            <SaveSiteButton site={site} />
          </View>
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
        <Text style={styles.cardLabel}>12-Hour Trend</Text>
        <SiteCharts history={history} units={units} />
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

// Star toggle that saves the site to the Locations tab on this phone
function SaveSiteButton({ site }) {
  const { isSiteSaved, toggleSavedSite } = useSavedSites();
  const isSaved = isSiteSaved(site.id);
  return (
    <TouchableOpacity
      style={[styles.saveButton, isSaved && styles.saveButtonOn]}
      onPress={() => toggleSavedSite(site.id)}
      accessibilityRole="togglebutton"
      accessibilityLabel={`Save ${site.name}`}
      accessibilityState={{ checked: isSaved }}
    >
      <Text style={[styles.saveText, isSaved && styles.saveTextOn]}>{isSaved ? '★ Saved' : '☆ Save'}</Text>
    </TouchableOpacity>
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
  return (
    <View style={styles.card}>
      <Text style={styles.message}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 10 },
  back: { padding: 16, paddingBottom: 4 },
  backText: { color: COLORS.accent, fontSize: 13 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 16 },
  title: { flexShrink: 1, color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold', paddingHorizontal: 16 },
  saveButton: { borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: 14, paddingVertical: 4, paddingHorizontal: 10 },
  saveButtonOn: { borderColor: COLORS.warning },
  saveText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: 'bold' },
  saveTextOn: { color: COLORS.warning },
  subtitle: { color: COLORS.textMuted, fontSize: 10, paddingHorizontal: 16, marginBottom: 12 },
  card: { marginHorizontal: 16, marginBottom: 10, backgroundColor: 'rgba(126,206,244,0.06)', borderWidth: 1, borderColor: 'rgba(126,206,244,0.15)', borderRadius: 10, padding: 12 },
  cardLabel: { color: COLORS.accent, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  tableRow: { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: 'rgba(126,206,244,0.08)' },
  timeCol: { flex: 1.1 },
  col: { flex: 1, color: COLORS.textMuted, fontSize: 9, textTransform: 'uppercase' },
  colText: { flex: 1, color: COLORS.textSecondary, fontSize: 11 },
  message: { color: COLORS.textSecondary, fontSize: 13, textAlign: 'center' },
});

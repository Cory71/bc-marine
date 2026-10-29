import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useApp } from '../context/AppContext';
import SettingsButton from '../components/SettingsButton';
import { useColors, makeStyles } from '../theme';
import { timeSince, formatTime, getSunMoon, degreesToCardinal, tidyForecastText, formatWind, observationDetail, formatReadingAge, isOldReading, formatSpeed, formatHeight, formatDistance, noTidesMessage } from '@bc-marine/shared';
import WarningBanner from '../components/WarningBanner';
import CardWrapper from '../components/CardWrapper';

export default function DashboardScreen({ navigation }) {
  const styles = useStyles();
  const COLORS = useColors();
  const { activeStation, tides, weather, tideEvents, marineForecast, observations, observationsLoading, loading, error, lastUpdated, refresh, units } = useApp();

  const now = new Date();
  const sunMoon = getSunMoon(activeStation.lat, activeStation.lon, units);
  const currentWeather = weather.reduce((closest, h) =>
    Math.abs(new Date(h.time) - now) < Math.abs(new Date(closest.time) - now) ? h : closest
  , weather[0] ?? {});
  const nextHigh = tideEvents.find(e => e.type === 'HIGH' && new Date(e.time) > now);
  const nextLow = tideEvents.find(e => e.type === 'LOW' && new Date(e.time) > now);
  // Use the closest hourly reading for current tide height
  const currentTide = tides.reduce((closest, h) =>
    Math.abs(new Date(h.time) - now) < Math.abs(new Date(closest.time) - now) ? h : closest
  , tides[0] ?? { heightFt: null });
  // Current phase: compare speed to previous hour; show -- when no data
  const currentIdx = weather.findIndex(h => h.time === currentWeather.time);
  const prevSpeed = weather[currentIdx - 1]?.currentSpeedKts ?? null;
  const currentSpeed = currentWeather?.currentSpeedKts ?? null;
  const currentPhase = currentSpeed != null ? (currentSpeed >= (prevSpeed ?? 0) ? 'Flooding' : 'Ebbing') : null;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.accent} size="large" />
        <Text style={styles.loadingText}>Loading marine data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={COLORS.accent} />}
    >
      {/* Location Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.labelRow}>
            <Text style={styles.stationLabel}>📍 {activeStation.name.toUpperCase()}, BC</Text>
            <SettingsButton />
          </View>
          <Text style={styles.title}>Marine Dashboard</Text>
          <Text style={styles.updated}>{lastUpdated ? timeSince(lastUpdated, units) : ''} · Tap card for full detail</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.sunText}>🌅 {sunMoon.sunrise}</Text>
          <Text style={styles.sunText}>🌇 {sunMoon.sunset}</Text>
          <Text style={styles.moonText}>{sunMoon.moonPhase}</Text>
        </View>
      </View>

      {/* Warning Banner */}
      <WarningBanner warnings={marineForecast.warnings} />

      {/* EC Marine Forecast */}
      <CardWrapper label="📡 EC Marine Forecast">
        <Text style={styles.forecastText}>{tidyForecastText(marineForecast.forecast)}</Text>
        <Text style={styles.sourceText}>Source: Environment Canada · {activeStation.region}</Text>
      </CardWrapper>

      {/* Wind & Weather */}
      <CardWrapper label="💨 Wind & Weather" linkText="Hourly View" onPress={() => navigation.navigate('WeatherDetail')}>
        <View style={styles.row}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Wind</Text>
            <Text style={styles.statValue}>
              {currentWeather?.windDirectionDeg != null ? degreesToCardinal(currentWeather.windDirectionDeg) + ' ' : ''}{formatSpeed(currentWeather?.windSpeedKts, units)}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Waves</Text>
            <Text style={styles.statValue}>{formatHeight(currentWeather?.waveHeightFt, units)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Visibility</Text>
            <Text style={styles.statValue}>{formatDistance(currentWeather?.visibilityKm, units)}</Text>
          </View>
        </View>
      </CardWrapper>

      {/* Nearby lighthouses and buoys: what's actually happening right now */}
      <CardWrapper label="🗼 Nearby Observations" linkText="All Readings" onPress={() => navigation.navigate('ObservationsDetail')}>
        {observationsLoading && observations.length === 0 ? (
          <Text style={styles.sourceText}>Loading nearby observations…</Text>
        ) : observations.length === 0 ? (
          <Text style={styles.sourceText}>No observation sites nearby.</Text>
        ) : (
          observations.map(observation => {
            // Readings older than 3 hours are faded and labelled, never shown as current
            const isOld = observation.reading && isOldReading(observation.reading.observedAt);
            return (
              <View key={observation.site.id} style={styles.obsRow}>
                {/* Line 1: name, type badge and how long ago */}
                <View style={styles.obsLine}>
                  <View style={styles.obsNameWrap}>
                    <Text style={styles.obsName}>{observation.site.name}</Text>
                    <Text style={[styles.obsBadge, observation.site.type === 'buoy' ? styles.obsBuoy : styles.obsLighthouse]}>
                      {observation.site.type === 'buoy' ? 'BUOY' : 'LIGHTHOUSE'}
                    </Text>
                  </View>
                  {observation.reading && (
                    <Text style={styles.obsAge}>
                      {isOld ? 'Old · ' : ''}{formatReadingAge(observation.reading.observedAt)}
                    </Text>
                  )}
                </View>
                {/* Line 2: the big wind reading, then gust (lighthouses) or waves (buoys) */}
                {observation.reading ? (
                  <View style={[styles.obsLine2, isOld && styles.obsOld]}>
                    <Text style={styles.obsWind}>{formatWind(observation.reading, units)}</Text>
                    <Text style={styles.obsDetail}>{observationDetail(observation, units)}</Text>
                  </View>
                ) : (
                  <Text style={styles.obsDetail}>No recent report</Text>
                )}
              </View>
            );
          })
        )}
      </CardWrapper>

      {/* Tides */}
      <CardWrapper label="🌊 Tides — DFO" linkText="Full Chart" onPress={() => navigation.navigate('TideDetail')}>
        {/* Offshore areas have no tide station */}
        {activeStation.offshore ? (
          <Text style={styles.forecastText}>{noTidesMessage(activeStation)}</Text>
        ) : (
        <View style={styles.row}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Next High</Text>
            <Text style={styles.statValue}>{nextHigh ? formatHeight(nextHigh.heightFt, units) : '--'}</Text>
            <Text style={styles.statSub}>{nextHigh ? formatTime(nextHigh.time, units) : ''}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Next Low</Text>
            <Text style={styles.statValue}>{nextLow ? formatHeight(nextLow.heightFt, units) : '--'}</Text>
            <Text style={styles.statSub}>{nextLow ? formatTime(nextLow.time, units) : ''}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Now</Text>
            <Text style={styles.statValue}>{formatHeight(currentTide?.heightFt, units)}</Text>
          </View>
        </View>
        )}
      </CardWrapper>

      {/* Tidal Currents */}
      <CardWrapper label="🔄 Tidal Currents" linkText="Full Detail" onPress={() => navigation.navigate('CurrentsDetail')}>
        <View style={styles.row}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Speed</Text>
            <Text style={styles.statValue}>{formatSpeed(currentWeather?.currentSpeedKts, units, 1)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Direction</Text>
            <Text style={styles.statValue}>{currentWeather?.currentDirectionDeg != null ? degreesToCardinal(currentWeather.currentDirectionDeg) : '--'}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Phase</Text>
            <Text style={[styles.statValue, { color: currentPhase === 'Flooding' ? COLORS.safe : currentPhase === 'Ebbing' ? COLORS.warning : COLORS.textMuted }]}>
              {currentPhase ?? '--'}
            </Text>
          </View>
        </View>
      </CardWrapper>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const useStyles = makeStyles(COLORS => ({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, paddingBottom: 8 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stationLabel: { color: COLORS.accent, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' },
  title: { color: COLORS.textPrimary, fontSize: 22, fontWeight: 'bold', marginTop: 2 },
  updated: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  row: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, backgroundColor: `rgba(${COLORS.accentRgb},0.1)`, borderRadius: 6, padding: 8, alignItems: 'center' },
  statLabel: { color: COLORS.accent, fontSize: 9, textTransform: 'uppercase' },
  statValue: { color: COLORS.textPrimary, fontSize: 14, fontWeight: 'bold', marginTop: 2 },
  statSub: { color: COLORS.textSecondary, fontSize: 10, marginTop: 1 },
  obsRow: { paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: `rgba(${COLORS.accentRgb},0.08)` },
  obsLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  obsNameWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  obsName: { color: COLORS.textPrimary, fontSize: 13, fontWeight: 'bold' },
  obsBadge: { fontSize: 8, fontWeight: 'bold', letterSpacing: 0.5, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, overflow: 'hidden' },
  obsLighthouse: { color: COLORS.accent, backgroundColor: `rgba(${COLORS.accentRgb},0.16)` },
  obsBuoy: { color: COLORS.safe, backgroundColor: `rgba(${COLORS.safeRgb},0.16)` },
  obsAge: { color: COLORS.textMuted, fontSize: 10 },
  obsLine2: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 2 },
  obsWind: { color: COLORS.textPrimary, fontSize: 17, fontWeight: 'bold' },
  obsDetail: { color: COLORS.textSecondary, fontSize: 12 },
  obsOld: { opacity: 0.6 },
  forecastText: { color: COLORS.textSecondary, fontSize: 11, lineHeight: 18 },
  sourceText: { color: COLORS.textMuted, fontSize: 10, marginTop: 6 },
  loadingText: { color: COLORS.textSecondary, marginTop: 12 },
  errorText: { color: COLORS.warning, padding: 24, textAlign: 'center' },
  sunText: { color: COLORS.accent, fontSize: 11 },
  moonText: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
}));

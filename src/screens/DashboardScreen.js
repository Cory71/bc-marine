import { View, Text, ScrollView, RefreshControl, StyleSheet, ActivityIndicator } from 'react-native';
import { useApp } from '../context/AppContext';
import { COLORS } from '../utils/constants';
import { timeSince, formatTime, getSunMoon, degreesToCardinal } from '../utils/units';
import WarningBanner from '../components/WarningBanner';
import CardWrapper from '../components/CardWrapper';

export default function DashboardScreen({ navigation }) {
  const { activeStation, tides, weather, tideEvents, marineForecast, loading, error, lastUpdated, refresh } = useApp();

  const now = new Date();
  const sunMoon = getSunMoon(activeStation.lat, activeStation.lon);
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
          <Text style={styles.stationLabel}>📍 {activeStation.name.toUpperCase()}, BC</Text>
          <Text style={styles.title}>Marine Dashboard</Text>
          <Text style={styles.updated}>{lastUpdated ? timeSince(lastUpdated) : ''} · Tap card for full detail</Text>
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
        <Text style={styles.forecastText}>{marineForecast.forecast}</Text>
        <Text style={styles.sourceText}>Source: Environment Canada · {activeStation.region}</Text>
      </CardWrapper>

      {/* Wind & Weather */}
      <CardWrapper label="💨 Wind & Weather" linkText="Hourly View" onPress={() => navigation.navigate('WeatherDetail')}>
        <View style={styles.row}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Wind</Text>
            <Text style={styles.statValue}>
              {currentWeather?.windDirectionDeg != null ? degreesToCardinal(currentWeather.windDirectionDeg) + ' ' : ''}{currentWeather?.windSpeedKts?.toFixed(0) ?? '--'} kts
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Waves</Text>
            <Text style={styles.statValue}>{currentWeather?.waveHeightFt ?? '--'} ft</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Visibility</Text>
            <Text style={styles.statValue}>{currentWeather?.visibilityKm?.toFixed(0) ?? '--'} km</Text>
          </View>
        </View>
      </CardWrapper>

      {/* Tides */}
      <CardWrapper label="🌊 Tides — DFO" linkText="Full Chart" onPress={() => navigation.navigate('TideDetail')}>
        <View style={styles.row}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Next High</Text>
            <Text style={styles.statValue}>{nextHigh ? `${nextHigh.heightFt} ft` : '--'}</Text>
            <Text style={styles.statSub}>{nextHigh ? formatTime(nextHigh.time) : ''}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Next Low</Text>
            <Text style={styles.statValue}>{nextLow ? `${nextLow.heightFt} ft` : '--'}</Text>
            <Text style={styles.statSub}>{nextLow ? formatTime(nextLow.time) : ''}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Now</Text>
            <Text style={styles.statValue}>{currentTide?.heightFt != null ? `${currentTide.heightFt} ft` : '--'}</Text>
          </View>
        </View>
      </CardWrapper>

      {/* Tidal Currents */}
      <CardWrapper label="🔄 Tidal Currents" linkText="Full Detail" onPress={() => navigation.navigate('CurrentsDetail')}>
        <View style={styles.row}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Speed</Text>
            <Text style={styles.statValue}>{currentWeather?.currentSpeedKts?.toFixed(1) ?? '--'} kts</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, paddingBottom: 8 },
  stationLabel: { color: COLORS.accent, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' },
  title: { color: COLORS.textPrimary, fontSize: 22, fontWeight: 'bold', marginTop: 2 },
  updated: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  row: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, backgroundColor: 'rgba(126,206,244,0.1)', borderRadius: 6, padding: 8, alignItems: 'center' },
  statLabel: { color: COLORS.accent, fontSize: 9, textTransform: 'uppercase' },
  statValue: { color: COLORS.textPrimary, fontSize: 14, fontWeight: 'bold', marginTop: 2 },
  statSub: { color: COLORS.textSecondary, fontSize: 10, marginTop: 1 },
  forecastText: { color: COLORS.textSecondary, fontSize: 11, lineHeight: 18 },
  sourceText: { color: COLORS.textMuted, fontSize: 10, marginTop: 6 },
  loadingText: { color: COLORS.textSecondary, marginTop: 12 },
  errorText: { color: COLORS.warning, padding: 24, textAlign: 'center' },
  sunText: { color: COLORS.accent, fontSize: 11 },
  moonText: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
});

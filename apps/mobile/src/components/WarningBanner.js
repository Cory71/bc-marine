import { View, Text, StyleSheet } from 'react-native';
import { sortWarningsBySeverity, isSevereWarning } from '@bc-marine/shared';
import { COLORS } from '../theme';

// Shows the most severe active warning. Gale and above use the red style;
// strong wind and other warnings stay amber.
export default function WarningBanner({ warnings }) {
  if (!warnings || warnings.length === 0) return null;
  const [first] = sortWarningsBySeverity(warnings);
  const isSevere = isSevereWarning(first.title);

  return (
    <View style={[styles.banner, isSevere && styles.severeBanner]}>
      <Text style={styles.icon}>⚠️</Text>
      <View style={styles.text}>
        <Text style={[styles.title, isSevere && styles.severeTitle]}>{first.title}</Text>
        <Text style={[styles.body, isSevere && styles.severeBody]} numberOfLines={2}>{first.summary}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { marginHorizontal: 16, marginBottom: 10, backgroundColor: 'rgba(255,159,67,0.15)', borderWidth: 1, borderColor: 'rgba(255,159,67,0.5)', borderRadius: 8, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { fontSize: 16 },
  text: { flex: 1 },
  title: { color: COLORS.warning, fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  body: { color: '#d4a96a', fontSize: 10, marginTop: 2 },
  // Gale, storm and hurricane-force: soft coral instead of amber
  severeBanner: { backgroundColor: 'rgba(255,123,114,0.15)', borderColor: 'rgba(255,123,114,0.5)' },
  severeTitle: { color: COLORS.danger },
  severeBody: { color: '#e8a8a2' },
});

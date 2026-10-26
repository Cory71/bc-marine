import { View, Text } from 'react-native';
import { sortWarningsBySeverity, isSevereWarning } from '@bc-marine/shared';
import { makeStyles } from '../theme';

// Shows the most severe active warning. Gale and above use the red style;
// strong wind and other warnings stay amber.
export default function WarningBanner({ warnings }) {
  const styles = useStyles();
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

const useStyles = makeStyles(COLORS => ({
  banner: { marginHorizontal: 16, marginBottom: 10, backgroundColor: `rgba(${COLORS.warningRgb},0.15)`, borderWidth: 1, borderColor: `rgba(${COLORS.warningRgb},0.5)`, borderRadius: 8, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { fontSize: 16 },
  text: { flex: 1 },
  title: { color: COLORS.warning, fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  body: { color: COLORS.warningText, fontSize: 10, marginTop: 2 },
  // Gale, storm and hurricane-force: soft coral instead of amber
  severeBanner: { backgroundColor: `rgba(${COLORS.dangerRgb},0.15)`, borderColor: `rgba(${COLORS.dangerRgb},0.5)` },
  severeTitle: { color: COLORS.danger },
  severeBody: { color: COLORS.dangerText },
}));

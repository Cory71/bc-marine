import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/constants';

export default function WarningBanner({ warnings }) {
  if (!warnings || warnings.length === 0) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.icon}>⚠️</Text>
      <View style={styles.text}>
        <Text style={styles.title}>{warnings[0].title}</Text>
        <Text style={styles.body} numberOfLines={2}>{warnings[0].summary}</Text>
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
});

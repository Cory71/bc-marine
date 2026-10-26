import { View, Text, TouchableOpacity } from 'react-native';
import { makeStyles } from '../theme';

export default function CardWrapper({ label, linkText, onPress, children }) {
  const styles = useStyles();
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {linkText && (
          <TouchableOpacity onPress={onPress}>
            <Text style={styles.link}>› {linkText}</Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

const useStyles = makeStyles(COLORS => ({
  card: { marginHorizontal: 16, marginBottom: 10, backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: 10, padding: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { color: COLORS.accent, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  link: { color: COLORS.textMuted, fontSize: 10 },
}));

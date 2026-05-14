import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/constants';

export default function TideDetailScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tide Detail</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  text: { color: COLORS.textPrimary, fontSize: 20 },
});

import { useState } from 'react';
import { View, Text, TouchableOpacity, Pressable, Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import UnitsPicker from './UnitsPicker';
import { useApp } from '../context/AppContext';
import { COLORS } from '../theme';

// Gear button for the top of each screen; opens a Settings panel that drops down from the top
export default function SettingsButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={styles.gear}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Settings"
      >
        <Text style={styles.gearText}>⚙️</Text>
      </TouchableOpacity>
      <SettingsPanel visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

function SettingsPanel({ visible, onClose }) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Tapping the dimmed area below the panel closes it */}
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close settings">
        {/* An inner Pressable stops taps on the panel from closing it */}
        <Pressable style={[styles.panel, { paddingTop: insets.top + 12 }]} onPress={() => {}}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Settings</Text>
            <TouchableOpacity onPress={onClose} accessibilityRole="button">
              <Text style={styles.done}>Done</Text>
            </TouchableOpacity>
          </View>
          <OpeningStationSetting />
          <Text style={[styles.sectionLabel, styles.unitsLabel]}>UNITS</Text>
          <UnitsPicker />
          <Text style={styles.note}>Settings are saved on this phone until you change them.</Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Which station the app opens with, and a button to switch it to the one being viewed
function OpeningStationSetting() {
  const { activeStation, openingStation, setOpeningStation } = useApp();
  const isViewingOpeningStation = activeStation.name === openingStation.name;

  return (
    <View>
      <Text style={styles.sectionLabel}>OPENING STATION</Text>
      <Text style={styles.opening}>
        Opens with <Text style={styles.openingName}>{openingStation.name}</Text>
      </Text>
      {!isViewingOpeningStation && (
        <TouchableOpacity
          style={styles.openButton}
          onPress={() => setOpeningStation(activeStation)}
          accessibilityRole="button"
        >
          <Text style={styles.openButtonText}>Open with {activeStation.name}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  gear: { padding: 6 },
  gearText: { fontSize: 20 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  panel: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: COLORS.cardBorder,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold' },
  done: { color: COLORS.accent, fontSize: 15, fontWeight: '600' },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  unitsLabel: { marginTop: 16 },
  opening: { color: COLORS.textSecondary, fontSize: 14, marginVertical: 4 },
  openingName: { color: COLORS.textPrimary, fontWeight: '700' },
  openButton: {
    marginTop: 6,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 8,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
  },
  openButtonText: { color: COLORS.accent, fontSize: 14, fontWeight: '600' },
  note: { color: COLORS.textSecondary, fontSize: 12, marginTop: 10 },
});

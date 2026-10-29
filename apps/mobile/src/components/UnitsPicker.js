import { View, Text, TouchableOpacity } from 'react-native';
import { UNIT_OPTIONS } from '@bc-marine/shared';
import { useApp } from '../context/AppContext';
import { makeStyles } from '../theme';

const KIND_LABELS = { speed: 'Speed', height: 'Height', temperature: 'Temperature', distance: 'Distance', pressure: 'Pressure', time: 'Time' };

// A row of toggle buttons for each kind of unit; the choice is saved on this phone
export default function UnitsPicker() {
  const styles = useStyles();
  const { units, setUnit } = useApp();

  return (
    <View>
      {Object.entries(UNIT_OPTIONS).map(([kind, options]) => (
        <View key={kind} style={styles.row}>
          <Text style={styles.label}>{KIND_LABELS[kind]}</Text>
          <View style={styles.options}>
            {options.map(option => {
              const isSelected = units[kind] === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.option, isSelected && styles.selected]}
                  onPress={() => setUnit(kind, option.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={[styles.optionText, isSelected && styles.selectedText]}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const useStyles = makeStyles(COLORS => ({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  label: { color: COLORS.textSecondary, fontSize: 13 },
  options: { flexDirection: 'row', borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: 8, overflow: 'hidden' },
  option: { paddingHorizontal: 12, paddingVertical: 6 },
  selected: { backgroundColor: `rgba(${COLORS.accentRgb},0.18)` },
  optionText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  selectedText: { color: COLORS.accent },
}));

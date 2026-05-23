import { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Location from 'expo-location';
import { useApp } from '../context/AppContext';
import { COLORS, BC_REGIONS, BC_STATIONS, BC_COMMUNITIES } from '../utils/constants';
import { findNearestStation } from '../utils/units';

export default function LocationsScreen({ navigation }) {
  const { activeStation, setActiveStation, savedStations, saveStation } = useApp();
  const [query, setQuery] = useState('');
  const [openRegions, setOpenRegions] = useState({});

  const allSearchable = [...BC_STATIONS, ...BC_COMMUNITIES];
  const searchResults = query
    ? allSearchable.filter(s =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.region.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  function handleSelectStation(station) {
    setActiveStation(station);
    saveStation(station);
    navigation.navigate('Home');
  }

  function toggleRegion(regionName) {
    setOpenRegions(prev => ({ ...prev, [regionName]: !prev[regionName] }));
  }

  async function handleUseLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location access is needed to find your nearest station.');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    const nearest = findNearestStation(loc.coords.latitude, loc.coords.longitude, allSearchable);
    handleSelectStation(nearest);
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>BC Locations</Text>
      <Text style={styles.subtitle}>Tap a region to expand · Tap a station to load conditions</Text>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search stations & weather areas..."
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* Use My Location button */}
      <TouchableOpacity style={styles.locationBtn} onPress={handleUseLocation}>
        <Text style={styles.locationBtnText}>📍 Use My Location — Find Nearest Station</Text>
      </TouchableOpacity>

      {/* Search results */}
      {query !== '' && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Search Results</Text>
          {searchResults.length === 0 && (
            <Text style={styles.emptyText}>No stations found.</Text>
          )}
          {searchResults.map((station, i) => (
            <TouchableOpacity key={`${station.id}_${i}`} style={styles.stationRow} onPress={() => handleSelectStation(station)}>
              <View>
                <Text style={styles.stationName}>{station.name}</Text>
                <Text style={styles.stationArea}>{station.region}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Saved favourites */}
      {query === '' && savedStations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>⭐ Saved Locations</Text>
          <View style={styles.savedList}>
            {savedStations.map((station, i) => (
              <TouchableOpacity
                key={`${station.id}_${i}`}
                style={[styles.stationRow, i < savedStations.length - 1 && styles.stationBorder]}
                onPress={() => handleSelectStation(station)}
              >
                <View>
                  <Text style={[styles.stationName, station.id === activeStation.id && { color: COLORS.safe }]}>
                    {station.name} {station.id === activeStation.id ? '●' : ''}
                  </Text>
                  <Text style={styles.stationArea}>{station.region}</Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Regional accordions */}
      {query === '' && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Browse by Region</Text>
          {BC_REGIONS.map(region => (
            <View key={region.name} style={styles.accordion}>
              <TouchableOpacity style={styles.regionHeader} onPress={() => toggleRegion(region.name)}>
                <Text style={styles.regionName}>{region.name}</Text>
                <Text style={styles.regionToggle}>{openRegions[region.name] ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {openRegions[region.name] && (
                <View style={styles.regionBody}>
                  {region.areas.map(area => (
                    <View key={area.name}>
                      <View style={styles.areaLabel}>
                        <Text style={styles.areaName}>{area.name}</Text>
                      </View>
                      {area.stations.map((station, i) => (
                        <TouchableOpacity
                          key={`${station.id}_${i}`}
                          style={[styles.stationRow, i < area.stations.length - 1 && styles.stationBorder]}
                          onPress={() => handleSelectStation({ ...station, region: area.name, coast: region.name })}
                        >
                          <Text style={[styles.stationName, station.id === activeStation.id && { color: COLORS.safe }]}>
                            {station.name} {station.id === activeStation.id ? '●' : ''}
                          </Text>
                          <Text style={styles.arrow}>›</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  title: { color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold', paddingHorizontal: 16, paddingTop: 16 },
  subtitle: { color: COLORS.textMuted, fontSize: 10, paddingHorizontal: 16, marginBottom: 12 },
  searchBar: { marginHorizontal: 16, marginBottom: 8, backgroundColor: 'rgba(126,206,244,0.08)', borderWidth: 1, borderColor: 'rgba(126,206,244,0.2)', borderRadius: 8, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchIcon: { fontSize: 13 },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 11 },
  locationBtn: { marginHorizontal: 16, marginBottom: 12, backgroundColor: 'rgba(126,206,244,0.12)', borderWidth: 1, borderColor: 'rgba(126,206,244,0.3)', borderRadius: 8, padding: 12, alignItems: 'center' },
  locationBtnText: { color: COLORS.accent, fontSize: 12, fontWeight: 'bold' },
  section: { marginBottom: 10 },
  savedList: { marginHorizontal: 16, backgroundColor: 'rgba(126,206,244,0.06)', borderWidth: 1, borderColor: 'rgba(126,206,244,0.15)', borderRadius: 10 },
  sectionLabel: { color: COLORS.accent, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginHorizontal: 16, marginBottom: 6 },
  emptyText: { color: COLORS.textMuted, fontSize: 12, paddingHorizontal: 16 },
  accordion: { marginHorizontal: 16, marginBottom: 6 },
  regionHeader: { backgroundColor: 'rgba(126,206,244,0.08)', borderWidth: 1, borderColor: 'rgba(126,206,244,0.2)', borderRadius: 8, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  regionName: { color: COLORS.textPrimary, fontSize: 13, fontWeight: 'bold' },
  regionToggle: { color: COLORS.accent, fontSize: 13 },
  regionBody: { borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(126,206,244,0.2)', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  areaLabel: { backgroundColor: 'rgba(126,206,244,0.06)', padding: 6, paddingHorizontal: 12 },
  areaName: { color: COLORS.accent, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 },
  stationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, paddingHorizontal: 12 },
  stationBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(126,206,244,0.06)' },
  stationName: { color: COLORS.textSecondary, fontSize: 13 },
  stationArea: { color: COLORS.textMuted, fontSize: 10, marginTop: 1 },
  arrow: { color: COLORS.textMuted, fontSize: 16 },
});

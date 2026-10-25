import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ALL_LOCATIONS, BC_STATIONS, loadStationData } from '@bc-marine/shared';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const defaultStation = BC_STATIONS.find(s => s.name === 'Victoria') ?? BC_STATIONS[0];
  const [activeStation, setActiveStation] = useState(defaultStation);
  const [savedStations, setSavedStations] = useState([defaultStation]);
  const [tides, setTides] = useState([]);
  const [tideEvents, setTideEvents] = useState([]);
  const [weeklyTides, setWeeklyTides] = useState([]);
  const [weather, setWeather] = useState([]);
  const [marineForecast, setMarineForecast] = useState({ warnings: [], forecast: '' });
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Load saved stations from device storage on app start
  useEffect(() => {
    AsyncStorage.getItem('savedStations').then(json => {
      if (!json) return;
      const saved = JSON.parse(json);
      // Refresh saved stations from the current list by name, so older saves pick up
      // corrected DFO ids and any missing region/coast
      const enriched = saved.map(s => ALL_LOCATIONS.find(location => location.name === s.name) ?? s);
      setSavedStations(enriched);
      AsyncStorage.setItem('savedStations', JSON.stringify(enriched));
    });
  }, []);

  // Fetch all data whenever the active station changes
  useEffect(() => {
    loadData();
  }, [activeStation]);

  async function loadData(forceRefresh = false) {
    setLoading(true);
    setError(null);
    try {
      const result = await loadStationData(activeStation, { forceRefresh });

      // Log any failures to the console so we can see which API is broken
      result.failures.forEach(label => console.warn(`[loadData] ${label} failed`));

      // A null key means that fetch failed — keep the previous data on screen
      if (result.tides) setTides(result.tides);
      if (result.tideEvents) setTideEvents(result.tideEvents);
      if (result.weeklyTides) setWeeklyTides(result.weeklyTides);
      if (result.weather) setWeather(result.weather);
      if (result.marineForecast) setMarineForecast(result.marineForecast);
      if (result.observations) setObservations(result.observations);

      setLastUpdated(new Date());
    } catch (e) {
      console.error('[loadData] unexpected error:', e);
      setError('Could not load data. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  // Match saved stations by name — a few nearby places share one DFO tide station id
  function saveStation(station) {
    const exists = savedStations.some(s => s.name === station.name);
    // Always update the saved data so region/coast are kept current
    const updated = exists
      ? savedStations.map(s => s.name === station.name ? station : s)
      : [...savedStations, station];
    setSavedStations(updated);
    AsyncStorage.setItem('savedStations', JSON.stringify(updated));
  }

  function removeStation(stationId) {
    const updated = savedStations.filter(s => s.id !== stationId);
    setSavedStations(updated);
    AsyncStorage.setItem('savedStations', JSON.stringify(updated));
  }

  return (
    <AppContext.Provider value={{
      activeStation, setActiveStation,
      savedStations, saveStation, removeStation,
      tides, tideEvents, weeklyTides, weather, marineForecast, observations,
      loading, error, lastUpdated,
      refresh: () => loadData(true),
    }}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook — use this in any screen: const { tides, weather } = useApp();
export function useApp() {
  return useContext(AppContext);
}

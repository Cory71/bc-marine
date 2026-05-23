import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BC_STATIONS } from '../utils/constants';
import { fetchTides, fetchTideEvents, fetchWeeklyTides } from '../services/dfoService';
import { fetchWeather } from '../services/weatherService';
import { fetchMarineForecast } from '../services/ecService';
import { clearCache } from '../services/cache';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Load saved stations from device storage on app start
  useEffect(() => {
    AsyncStorage.getItem('savedStations').then(json => {
      if (!json) return;
      const saved = JSON.parse(json);
      // Enrich any stations that are missing region/coast (saved before fix)
      const enriched = saved.map(s => {
        if (s.region) return s;
        const match = BC_STATIONS.find(b => b.name === s.name);
        return match ? { ...s, region: match.region, coast: match.coast } : s;
      });
      setSavedStations(enriched);
      AsyncStorage.setItem('savedStations', JSON.stringify(enriched));
    });
  }, []);

  // Fetch all data whenever the active station changes
  useEffect(() => {
    loadData();
  }, [activeStation]);

  async function loadData(forceRefresh = false) {
    if (forceRefresh) {
      const regionKey = activeStation.region
        ?? BC_STATIONS.find(s => s.id === activeStation.id)?.region;
      clearCache(`tides_${activeStation.id}`);
      clearCache(`tideEvents_${activeStation.id}`);
      clearCache(`weekly_${activeStation.id}`);
      clearCache(`weather_${activeStation.lat}_${activeStation.lon}`);
      clearCache(`ec_${regionKey}`);
    }
    setLoading(true);
    setError(null);
    try {
      // Region may be missing on stations loaded from AsyncStorage — look it up if so
      const region = activeStation.region
        ?? BC_STATIONS.find(s => s.id === activeStation.id)?.region;

      const [tidesResult, eventsResult, weeklyResult, weatherResult, forecastResult] = await Promise.allSettled([
        fetchTides(activeStation.id),
        fetchTideEvents(activeStation.id),
        fetchWeeklyTides(activeStation.id),
        fetchWeather(activeStation.lat, activeStation.lon),
        fetchMarineForecast(region),
      ]);

      // Log any failures to the console so we can see which API is broken
      const labels = ['tides', 'tideEvents', 'weeklyTides', 'weather', 'marineForecast'];
      [tidesResult, eventsResult, weeklyResult, weatherResult, forecastResult].forEach((r, i) => {
        if (r.status === 'rejected') console.warn(`[loadData] ${labels[i]} failed:`, r.reason);
      });

      if (tidesResult.status === 'fulfilled') setTides(tidesResult.value);
      if (eventsResult.status === 'fulfilled') setTideEvents(eventsResult.value);
      if (weeklyResult.status === 'fulfilled') setWeeklyTides(weeklyResult.value);
      if (weatherResult.status === 'fulfilled') setWeather(weatherResult.value);
      if (forecastResult.status === 'fulfilled') setMarineForecast(forecastResult.value);

      setLastUpdated(new Date());
    } catch (e) {
      console.error('[loadData] unexpected error:', e);
      setError('Could not load data. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  function saveStation(station) {
    const exists = savedStations.some(s => s.id === station.id);
    // Always update the saved data so region/coast are kept current
    const updated = exists
      ? savedStations.map(s => s.id === station.id ? station : s)
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
      tides, tideEvents, weeklyTides, weather, marineForecast,
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

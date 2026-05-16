import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BC_STATIONS } from '../utils/constants';
import { fetchTides, fetchTideEvents, fetchWeeklyTides } from '../services/dfoService';
import { fetchWeather } from '../services/weatherService';
import { fetchMarineForecast } from '../services/ecService';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [activeStation, setActiveStation] = useState(BC_STATIONS[0]); // Default: first BC station
  const [savedStations, setSavedStations] = useState([BC_STATIONS[0]]);
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
      if (json) setSavedStations(JSON.parse(json));
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
      const [tidesData, eventsData, weeklyData, weatherData, forecastData] = await Promise.all([
        fetchTides(activeStation.id),
        fetchTideEvents(activeStation.id),
        fetchWeeklyTides(activeStation.id),
        fetchWeather(activeStation.lat, activeStation.lon),
        fetchMarineForecast(activeStation.region),
      ]);
      setTides(tidesData);
      setTideEvents(eventsData);
      setWeeklyTides(weeklyData);
      setWeather(weatherData);
      setMarineForecast(forecastData);
      setLastUpdated(new Date());
    } catch (e) {
      setError('Could not load data. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  function saveStation(station) {
    const updated = savedStations.find(s => s.id === station.id)
      ? savedStations
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

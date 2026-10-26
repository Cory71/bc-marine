import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ALL_LOCATIONS, BC_STATIONS, loadStationData, normalizeUnits, DEFAULT_UNITS, findStationBySlug, toStationSlug } from '@bc-marine/shared';

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
  const [observationsLoading, setObservationsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [units, setUnits] = useState(DEFAULT_UNITS);
  const [openingStation, setOpeningStationState] = useState(defaultStation);
  // Data waits until the saved opening station is read, so Victoria isn't fetched for nothing
  const [startupDone, setStartupDone] = useState(false);
  // Counts requests so a slow, older response can't overwrite a newer station's data
  const latestRequestId = useRef(0);

  // Where each data set from loadStationData goes
  const SETTERS = {
    tides: setTides,
    tideEvents: setTideEvents,
    weeklyTides: setWeeklyTides,
    weather: setWeather,
    marineForecast: setMarineForecast,
    observations: setObservations,
  };

  // Load the saved unit choices on app start (bad or missing data gives the defaults)
  useEffect(() => {
    AsyncStorage.getItem('units')
      .then(json => setUnits(normalizeUnits(JSON.parse(json))))
      .catch(() => setUnits(DEFAULT_UNITS));
  }, []);

  // Change one unit and remember it on this phone until it's changed again
  function setUnit(kind, value) {
    const updated = { ...units, [kind]: value };
    setUnits(updated);
    AsyncStorage.setItem('units', JSON.stringify(updated));
  }

  // Open with the station chosen in Settings (Victoria until one is chosen)
  useEffect(() => {
    AsyncStorage.getItem('openingStation')
      .then(slug => {
        const station = slug && findStationBySlug(slug);
        if (station) {
          setOpeningStationState(station);
          setActiveStation(station);
        }
      })
      .catch(() => {})
      .finally(() => setStartupDone(true));
  }, []);

  // Remember which station the app opens with on this phone
  function setOpeningStation(station) {
    setOpeningStationState(station);
    AsyncStorage.setItem('openingStation', toStationSlug(station.name));
  }

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
    if (startupDone) loadData();
  }, [activeStation, startupDone]);

  async function loadData(forceRefresh = false) {
    const requestId = ++latestRequestId.current;
    const isLatestRequest = () => requestId === latestRequestId.current;
    // A new station starts empty, so its cards never mix with the old station's numbers.
    // A refresh keeps the current numbers on screen while the new ones load.
    if (!forceRefresh) clearStationData();
    setLoading(true);
    setObservationsLoading(true);
    setError(null);

    // Show each data set as soon as it arrives, instead of waiting for the slowest one
    function showData(key, value) {
      if (!isLatestRequest()) return;
      SETTERS[key](value);
      setLoading(false);
      if (key === 'observations') setObservationsLoading(false);
    }

    try {
      const result = await loadStationData(activeStation, { forceRefresh, onData: showData });
      if (!isLatestRequest()) return;

      // Log any failures to the console so we can see which API is broken
      result.failures.forEach(label => console.warn(`[loadData] ${label} failed`));
      setLastUpdated(new Date());
    } catch (e) {
      console.error('[loadData] unexpected error:', e);
      if (isLatestRequest()) setError('Could not load data. Check your connection and try again.');
    } finally {
      if (isLatestRequest()) {
        setLoading(false);
        setObservationsLoading(false);
      }
    }
  }

  // Empty every data set (used when switching to another station)
  function clearStationData() {
    setTides([]);
    setTideEvents([]);
    setWeeklyTides([]);
    setWeather([]);
    setMarineForecast({ warnings: [], forecast: '' });
    setObservations([]);
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
      tides, tideEvents, weeklyTides, weather, marineForecast, observations, observationsLoading,
      loading, error, lastUpdated,
      units, setUnit,
      openingStation, setOpeningStation,
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

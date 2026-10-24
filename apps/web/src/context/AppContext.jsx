import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  loadStationData,
  findStationBySlug,
  toStationSlug,
  getDefaultStation,
} from '@bc-marine/shared';
import { readSavedSlugs, writeSavedSlugs } from './savedStationsStorage.js';

const AppContext = createContext(null);

const EMPTY_FORECAST = { warnings: [], forecast: '' };

export function AppProvider({ children }) {
  const activeStation = useActiveStationFromUrl();
  const saved = useSavedStations();
  const data = useStationData(activeStation.station);

  const value = {
    activeStation: activeStation.station,
    setActiveStationBySlug: activeStation.setBySlug,
    ...saved,
    ...data,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Custom hook — use this in any page: const { tides, weather } = useApp();
export function useApp() {
  return useContext(AppContext);
}

// --- Active station lives in the URL (?station=tofino) so links can be shared ---
function useActiveStationFromUrl() {
  const [searchParams, setSearchParams] = useSearchParams();
  const slug = searchParams.get('station');
  const matchedStation = slug ? findStationBySlug(slug) : undefined;
  const station = matchedStation ?? getDefaultStation();

  const setBySlug = useCallback(
    newSlug =>
      setSearchParams(
        params => {
          params.set('station', newSlug);
          return params;
        },
        { replace: true }
      ),
    [setSearchParams]
  );

  // A missing or unknown slug shows Victoria — rewrite the URL to match
  useEffect(() => {
    if (!matchedStation) setBySlug(toStationSlug(station.name));
  }, [matchedStation, station, setBySlug]);

  return { station, setBySlug };
}

// --- Saved stations, kept in localStorage as slugs ---
function useSavedStations() {
  const [savedSlugs, setSavedSlugs] = useState(() => readSavedSlugs());

  function updateSavedSlugs(newSlugs) {
    setSavedSlugs(newSlugs);
    writeSavedSlugs(newSlugs);
  }

  function saveStation(station) {
    const slug = toStationSlug(station.name);
    if (!savedSlugs.includes(slug)) updateSavedSlugs([...savedSlugs, slug]);
  }

  function removeStation(slug) {
    updateSavedSlugs(savedSlugs.filter(savedSlug => savedSlug !== slug));
  }

  return {
    // Skip slugs that no longer match a station (e.g. renamed later)
    savedStations: savedSlugs.map(findStationBySlug).filter(Boolean),
    saveStation,
    removeStation,
    isSaved: slug => savedSlugs.includes(slug),
  };
}

// --- Tide, weather and forecast data for the active station ---
function useStationData(station) {
  const [tides, setTides] = useState([]);
  const [tideEvents, setTideEvents] = useState([]);
  const [weeklyTides, setWeeklyTides] = useState([]);
  const [weather, setWeather] = useState([]);
  const [marineForecast, setMarineForecast] = useState(EMPTY_FORECAST);
  const [failures, setFailures] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  // Which station the data on screen belongs to, and whether a manual refresh is running
  const [loadedStation, setLoadedStation] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  // Counts requests so a slow, older response can't overwrite a newer station's data
  const latestRequestId = useRef(0);

  // Loading until the data matches the active station (no extra state to keep in sync)
  const loading = loadedStation !== station || refreshing;

  const loadData = useCallback(
    async (forceRefresh = false) => {
      const requestId = ++latestRequestId.current;
      const isLatestRequest = () => requestId === latestRequestId.current;
      try {
        const result = await loadStationData(station, { forceRefresh });
        if (!isLatestRequest()) return;

        result.failures.forEach(label => console.warn(`[loadData] ${label} failed`));

        // A null key means that fetch failed — keep the previous data on screen
        if (result.tides) setTides(result.tides);
        if (result.tideEvents) setTideEvents(result.tideEvents);
        if (result.weeklyTides) setWeeklyTides(result.weeklyTides);
        if (result.weather) setWeather(result.weather);
        if (result.marineForecast) setMarineForecast(result.marineForecast);

        setFailures(result.failures);
        setLastUpdated(new Date());
      } finally {
        if (isLatestRequest()) {
          setLoadedStation(station);
          setRefreshing(false);
        }
      }
    },
    [station]
  );

  // Manual refresh: skip the cache and show the loading state meanwhile
  function refresh() {
    setRefreshing(true);
    loadData(true);
  }

  // Fetch all data whenever the active station changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    tides,
    tideEvents,
    weeklyTides,
    weather,
    marineForecast,
    failures,
    loading,
    lastUpdated,
    refresh,
  };
}

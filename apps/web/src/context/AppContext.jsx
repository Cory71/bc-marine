import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  loadStationData,
  findStationBySlug,
  toStationSlug,
  getDefaultStation,
} from '@bc-marine/shared';
import { readSavedSlugs, writeSavedSlugs } from './savedStationsStorage.js';
import { readUnits, writeUnits } from './unitsStorage.js';
import { readOpeningSlug, writeOpeningSlug } from './openingStationStorage.js';
import { readTheme, writeTheme, applyTheme } from './themeStorage.js';

const AppContext = createContext(null);

const EMPTY_FORECAST = { warnings: [], forecast: '' };

export function AppProvider({ children }) {
  const opening = useOpeningStation();
  const activeStation = useActiveStationFromUrl(opening.openingStation);
  const saved = useSavedStations();
  const data = useStationData(activeStation.station);
  const unitChoices = useUnitChoices();
  const themeChoice = useThemeChoice();

  const value = {
    activeStation: activeStation.station,
    setActiveStationBySlug: activeStation.setBySlug,
    ...saved,
    ...data,
    ...unitChoices,
    ...opening,
    ...themeChoice,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Custom hook — use this in any page: const { tides, weather } = useApp();
export function useApp() {
  return useContext(AppContext);
}

// --- Active station lives in the URL (?station=tofino) so links can be shared ---
// With no (or an unknown) ?station=, the opening station is shown instead
function useActiveStationFromUrl(openingStation) {
  const [searchParams, setSearchParams] = useSearchParams();
  const slug = searchParams.get('station');
  const matchedStation = slug ? findStationBySlug(slug) : undefined;
  const station = matchedStation ?? openingStation;

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

  // A missing or unknown slug shows the opening station — rewrite the URL to match
  useEffect(() => {
    if (!matchedStation) setBySlug(toStationSlug(station.name));
  }, [matchedStation, station, setBySlug]);

  return { station, setBySlug };
}

// --- The station the app opens with on this device (Victoria until one is chosen) ---
function useOpeningStation() {
  const [openingSlug, setOpeningSlug] = useState(() => readOpeningSlug());
  const openingStation = (openingSlug && findStationBySlug(openingSlug)) ?? getDefaultStation();

  function setOpeningStation(station) {
    const slug = toStationSlug(station.name);
    setOpeningSlug(slug);
    writeOpeningSlug(slug);
  }

  return { openingStation, setOpeningStation };
}

// --- Light / dark theme ("device" follows the computer or phone), kept in localStorage ---
function useThemeChoice() {
  const [theme, setThemeState] = useState(() => readTheme());

  // Show the theme on the page whenever it changes
  useEffect(() => applyTheme(theme), [theme]);

  function setTheme(newTheme) {
    setThemeState(newTheme);
    writeTheme(newTheme);
  }

  return { theme, setTheme };
}

// --- Display units (kts/km/h/mph, ft/m, °C/°F, km/nm), kept in localStorage ---
function useUnitChoices() {
  const [units, setUnits] = useState(() => readUnits());

  function setUnit(kind, value) {
    const updated = { ...units, [kind]: value };
    setUnits(updated);
    writeUnits(updated);
  }

  return { units, setUnit };
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

// What each data set holds before it first loads (same as the mobile app)
const EMPTY_DATA = {
  tides: [],
  tideEvents: [],
  weeklyTides: [],
  weather: [],
  marineForecast: EMPTY_FORECAST,
  observations: [],
};

// Which sources have arrived or failed, and for which station
const NO_SOURCES = { station: null, arrived: [], failed: [] };

function useStationData(station) {
  const [data, setData] = useState(EMPTY_DATA);
  const [sources, setSources] = useState(NO_SOURCES);
  const [lastUpdated, setLastUpdated] = useState(null);
  // Which station the finished load belongs to, and whether a manual refresh is running
  const [loadedStation, setLoadedStation] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  // Counts requests so a slow, older response can't overwrite a newer station's data
  const latestRequestId = useRef(0);

  // Loading until every source has answered for the active station
  const loading = loadedStation !== station || refreshing;
  const isCurrentStation = sources.station === station;

  // 'ready' (show data), 'failed' (show an error) or 'loading' (show a placeholder).
  // A refresh keeps 'ready' so the current numbers stay on screen meanwhile.
  function getSourceStatus(key) {
    if (isCurrentStation && sources.arrived.includes(key)) return 'ready';
    if (isCurrentStation && sources.failed.includes(key)) return 'failed';
    return 'loading';
  }

  const loadData = useCallback(
    async (forceRefresh = false) => {
      const requestId = ++latestRequestId.current;
      const isLatestRequest = () => requestId === latestRequestId.current;

      // Show each source on screen as soon as it arrives
      function showSource(key, value) {
        if (!isLatestRequest()) return;
        setData(previous => ({ ...previous, [key]: value }));
        setSources(previous => markArrived(previous, station, key));
      }

      try {
        const result = await loadStationData(station, { forceRefresh, onData: showSource });
        if (!isLatestRequest()) return;

        result.failures.forEach(key => console.warn(`[loadData] ${key} failed`));
        // A null key means that fetch failed — keep the previous data on screen
        for (const key of Object.keys(EMPTY_DATA)) {
          if (result[key]) showSource(key, result[key]);
        }
        setSources(previous => ({ ...markArrived(previous, station), failed: result.failures }));
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
    ...data,
    failures: isCurrentStation ? sources.failed : [],
    getSourceStatus,
    loading,
    lastUpdated,
    refresh,
  };
}

// Record that a source arrived. Arrivals for an older station are dropped first.
function markArrived(sources, station, key) {
  const isSameStation = sources.station === station;
  const arrived = isSameStation ? sources.arrived : [];
  const failed = isSameStation ? sources.failed : [];
  if (!key || arrived.includes(key)) return { station, arrived, failed };
  return {
    station,
    arrived: [...arrived, key],
    failed: failed.filter(failedKey => failedKey !== key),
  };
}

import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OBSERVATION_SITES } from '@bc-marine/shared';

// Saved lighthouses and buoys, remembered on this phone. Kept in one small
// store outside React so the site screen's star and the Locations list agree.

const STORAGE_KEY = 'savedSites';

// ---------- The store ----------

let savedIds = [];
let hasStartedLoading = false;
let hasChangedSinceLoading = false; // a tap before storage answers wins
const listeners = new Set();

function notifyListeners() {
  listeners.forEach(listener => listener());
}

// Read the saved list once, the first time a screen needs it
function loadSavedIds() {
  hasStartedLoading = true;
  AsyncStorage.getItem(STORAGE_KEY)
    .then(json => {
      const saved = JSON.parse(json);
      const isIdList = Array.isArray(saved) && saved.every(id => typeof id === 'string');
      if (isIdList && !hasChangedSinceLoading) {
        savedIds = saved;
        notifyListeners();
      }
    })
    .catch(() => {}); // Bad or missing data just means nothing is saved yet
}

function setSavedIds(ids) {
  savedIds = ids;
  hasChangedSinceLoading = true;
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids)).catch(() => {});
  notifyListeners();
}

function subscribe(listener) {
  if (!hasStartedLoading) loadSavedIds();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSavedIds() {
  return savedIds;
}

// ---------- The hook ----------

// Saved sites (in the order they were saved), plus ways to change the list
export function useSavedSites() {
  const ids = useSyncExternalStore(subscribe, getSavedIds);
  // Skip ids for sites that no longer exist
  const savedSites = ids.map(id => OBSERVATION_SITES.find(site => site.id === id)).filter(Boolean);

  return {
    savedSites,
    isSiteSaved: siteId => ids.includes(siteId),
    toggleSavedSite: siteId =>
      setSavedIds(ids.includes(siteId) ? ids.filter(id => id !== siteId) : [...ids, siteId]),
    removeSavedSite: siteId => setSavedIds(ids.filter(id => id !== siteId)),
  };
}

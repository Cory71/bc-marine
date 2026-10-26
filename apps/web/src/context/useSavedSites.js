import { useSyncExternalStore } from 'react';
import { OBSERVATION_SITES } from '@bc-marine/shared';
import { readSavedSiteIds, writeSavedSiteIds } from './savedSitesStorage.js';

// Saved lighthouses and buoys, kept in one small store outside React so the
// site page's star and the sidebar list always agree.

// ---------- The store ----------

let savedIds = null; // read from storage the first time it's needed
const listeners = new Set();

function getSavedIds() {
  if (savedIds === null) savedIds = readSavedSiteIds();
  return savedIds;
}

function setSavedIds(ids) {
  savedIds = ids;
  writeSavedSiteIds(ids);
  listeners.forEach(listener => listener());
}

// Re-read saved sites from storage, e.g. after another tab changed them
export function reloadSavedSites() {
  savedIds = readSavedSiteIds();
  listeners.forEach(listener => listener());
}

// Listen for changes; storage changes from other tabs are only watched while
// something on the page is using the list
function subscribe(listener) {
  if (listeners.size === 0) window.addEventListener('storage', reloadSavedSites);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener('storage', reloadSavedSites);
  };
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

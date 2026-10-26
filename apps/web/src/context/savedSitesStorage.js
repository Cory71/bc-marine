const STORAGE_KEY = 'savedSites';

// Read saved lighthouse and buoy ids. Private windows, blocked storage or bad
// data all fall back to an empty list instead of crashing the app.
export function readSavedSiteIds(storage = window.localStorage) {
  try {
    const saved = JSON.parse(storage.getItem(STORAGE_KEY));
    const isIdList = Array.isArray(saved) && saved.every(id => typeof id === 'string');
    return isIdList ? saved : [];
  } catch {
    return [];
  }
}

// Save site ids. Failing to save (e.g. storage full) isn't worth crashing over.
export function writeSavedSiteIds(ids, storage = window.localStorage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Ignore — the list still works for this visit
  }
}

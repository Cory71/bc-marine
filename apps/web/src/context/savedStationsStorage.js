import { toStationSlug, DEFAULT_STATION_NAME } from '@bc-marine/shared';

const STORAGE_KEY = 'savedStations';

// Saved stations are stored as slugs, because station ids aren't unique
function getDefaultSlugs() {
  return [toStationSlug(DEFAULT_STATION_NAME)];
}

// Read saved station slugs. Private windows, blocked storage or bad data
// all fall back to the default list instead of crashing the app.
export function readSavedSlugs(storage = window.localStorage) {
  try {
    const saved = JSON.parse(storage.getItem(STORAGE_KEY));
    const isSlugList = Array.isArray(saved) && saved.every(slug => typeof slug === 'string');
    return isSlugList ? saved : getDefaultSlugs();
  } catch {
    return getDefaultSlugs();
  }
}

// Save station slugs. Failing to save (e.g. storage full) isn't worth crashing over.
export function writeSavedSlugs(slugs, storage = window.localStorage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    // Ignore — the list still works for this visit
  }
}

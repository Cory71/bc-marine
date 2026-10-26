const STORAGE_KEY = 'openingStation';

// Read the slug of the station the app opens with (null if none saved or storage is blocked)
export function readOpeningSlug(storage = window.localStorage) {
  try {
    return storage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

// Save the opening station's slug. Failing to save isn't worth crashing over.
export function writeOpeningSlug(slug, storage = window.localStorage) {
  try {
    storage.setItem(STORAGE_KEY, slug);
  } catch {
    // Ignore — the station still opens for this visit
  }
}

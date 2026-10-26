import { normalizeUnits } from '@bc-marine/shared';

const STORAGE_KEY = 'units';

// Read the saved unit choices. Blocked storage or bad data gives the defaults.
export function readUnits(storage = window.localStorage) {
  try {
    return normalizeUnits(JSON.parse(storage.getItem(STORAGE_KEY)));
  } catch {
    return normalizeUnits(null);
  }
}

// Save the unit choices. Failing to save isn't worth crashing over.
export function writeUnits(units, storage = window.localStorage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(units));
  } catch {
    // Ignore — the choice still applies for this visit
  }
}

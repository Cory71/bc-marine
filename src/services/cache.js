// In-memory cache — stores API results for 30 minutes to avoid redundant requests
const store = {};
const TTL_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

// Save data to cache with a timestamp
export function setCache(key, data) {
  store[key] = { data, timestamp: Date.now() };
}

// Get cached data — returns null if missing or expired
export function getCache(key) {
  const entry = store[key];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > TTL_MS) return null;
  return entry.data;
}

// Remove a specific cache entry (used on manual refresh)
export function clearCache(key) {
  delete store[key];
}

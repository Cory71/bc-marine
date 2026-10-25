// In-memory cache — stores API results so we don't re-request them on every load
const store = {};
const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

// Save data to cache. Most data keeps 30 minutes; fast-changing data can pass a shorter time.
export function setCache(key, data, ttlMs = DEFAULT_TTL_MS) {
  store[key] = { data, expiresAt: Date.now() + ttlMs };
}

// Get cached data — returns null if missing or expired
export function getCache(key) {
  const entry = store[key];
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) return null;
  return entry.data;
}

// Remove a specific cache entry (used on manual refresh)
export function clearCache(key) {
  delete store[key];
}

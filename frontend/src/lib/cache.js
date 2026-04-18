/**
 * Simple caching utility using localStorage
 * Stores API responses persistently across page navigation
 */

const CACHE_PREFIX = 'crisislens_cache_'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Get cached data if it exists and hasn't expired
 */
export function getCached(key) {
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + key)
    if (!cached) return null

    const { data, timestamp } = JSON.parse(cached)
    const age = Date.now() - timestamp

    if (age > CACHE_TTL_MS) {
      // Cache expired, remove it
      localStorage.removeItem(CACHE_PREFIX + key)
      console.log(`[Cache] Expired: ${key}`)
      return null
    }

    console.log(`[Cache] Hit: ${key} (age: ${Math.round(age / 1000)}s)`)
    return data
  } catch (err) {
    console.error(`[Cache] Error reading ${key}:`, err)
    return null
  }
}

/**
 * Store data in cache
 */
export function setCached(key, data) {
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
    }
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheData))
    console.log(`[Cache] Stored: ${key}`)
  } catch (err) {
    console.error(`[Cache] Error storing ${key}:`, err)
  }
}

/**
 * Clear specific cache key
 */
export function clearCache(key) {
  try {
    localStorage.removeItem(CACHE_PREFIX + key)
    console.log(`[Cache] Cleared: ${key}`)
  } catch (err) {
    console.error(`[Cache] Error clearing ${key}:`, err)
  }
}

/**
 * Clear all crisislens cache
 */
export function clearAllCache() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key && key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key)
      }
    }
    console.log('[Cache] Cleared all CrisisLens cache')
  } catch (err) {
    console.error('[Cache] Error clearing all cache:', err)
  }
}

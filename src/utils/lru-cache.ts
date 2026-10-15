/**
 * lru-cache.ts - In-memory LRU cache with TTL
 *
 * A small, dependency-free least-recently-used cache for Google Maps API
 * responses. Entries expire after a TTL and the oldest entries are evicted
 * once the cache is full, bounding memory use. Cache keys must never
 * contain secrets: use cacheKey() to redact API keys from URLs.
 *
 * Dependencies: None
 *
 * @author Wonky
 */

// ====================================
// LRU Cache
// ====================================

interface CacheEntry<V> {
  value: V;
  expiresAt: number;
}

/**
 * Simple LRU cache with per-entry TTL and a max entry count.
 * Recency is refreshed on get(); expired entries are dropped lazily.
 */
export class LruCache<K, V> {
  private readonly entries = new Map<K, CacheEntry<V>>();

  /**
   * @param {number} maxEntries - Maximum entries before oldest are evicted.
   * @param {number} ttlMs - Time-to-live per entry in milliseconds.
   */
  constructor(
    private readonly maxEntries: number,
    private readonly ttlMs: number
  ) {}

  get(key: K): V | undefined {
    const entry = this.entries.get(key);
    if (!entry) {
      return undefined;
    }
    if (Date.now() > entry.expiresAt) {
      this.entries.delete(key);
      return undefined;
    }
    // Refresh recency: delete + re-insert moves it to the newest position.
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V): void {
    if (this.entries.has(key)) {
      this.entries.delete(key);
    }
    this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    while (this.entries.size > this.maxEntries) {
      // Map iterates in insertion order; the first key is the oldest.
      const oldest = this.entries.keys().next();
      if (!oldest.done) {
        this.entries.delete(oldest.value);
      } else {
        break;
      }
    }
  }

  get size(): number {
    return this.entries.size;
  }

  clear(): void {
    this.entries.clear();
  }
}

/**
 * Builds a cache key from a request URL, redacting any API key parameter
 * so secrets never land in cache keys (or in cache-debug output).
 *
 * @param {string} url - The request URL, optionally with extra key material appended.
 * @returns {string} The redacted cache key.
 */
export function cacheKey(url: string): string {
  return url.replace(/([?&]key=)[^&]*/i, "$1[REDACTED]");
}

/**
 * Returns the cached value for key, or runs fetcher, caches its result,
 * and returns it. Rejections are never cached.
 *
 * @param {LruCache<string, V>} cache - The cache to use.
 * @param {string} key - The cache key (already redacted via cacheKey()).
 * @param {() => Promise<V>} fetcher - Loads the value on a cache miss.
 * @returns {Promise<V>} The cached or freshly fetched value.
 */
export async function getOrFetch<V>(
  cache: LruCache<string, V>,
  key: string,
  fetcher: () => Promise<V>
): Promise<V> {
  const hit = cache.get(key);
  if (hit !== undefined) {
    return hit;
  }
  const value = await fetcher();
  cache.set(key, value);
  return value;
}

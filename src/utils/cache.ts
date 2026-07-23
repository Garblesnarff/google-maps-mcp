/**
 * cache.ts - Small dependency-free in-memory TTL + LRU cache.
 *
 * Used by http.ts to transparently cache successful upstream responses.
 * No external dependencies; safe to import anywhere in the server.
 */

interface CacheEntry<V> {
  value: V;
  expiresAt: number;
}

const DEFAULT_MAX_ENTRIES = 500;

export class TtlCache<V> {
  private readonly maxEntries: number;
  private readonly store = new Map<string, CacheEntry<V>>();
  private hits = 0;
  private misses = 0;

  constructor(maxEntries: number = DEFAULT_MAX_ENTRIES) {
    this.maxEntries = maxEntries;
  }

  /**
   * Look up a key. Returns undefined on miss (including lazily-expired
   * entries). A hit moves the entry to the "most recently used" end.
   */
  get(key: string): V | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return undefined;
    }
    if (entry.expiresAt <= Date.now()) {
      // Expired: evict lazily and count as a miss.
      this.store.delete(key);
      this.misses++;
      return undefined;
    }
    // Refresh recency: delete + re-insert moves the key to the end of the
    // Map's iteration order, which we treat as "most recently used".
    this.store.delete(key);
    this.store.set(key, entry);
    this.hits++;
    return entry.value;
  }

  /** Store a value with a TTL in milliseconds. Evicts the oldest-accessed entry if over capacity. */
  set(key: string, value: V, ttlMs: number): void {
    if (this.store.has(key)) {
      this.store.delete(key);
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
    while (this.store.size > this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey === undefined) break;
      this.store.delete(oldestKey);
    }
  }

  /** Remove all entries and reset hit/miss counters. */
  clear(): void {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }

  stats(): { size: number; hits: number; misses: number } {
    return { size: this.store.size, hits: this.hits, misses: this.misses };
  }
}

/** Single shared default instance used by http.ts. */
const defaultCache = new TtlCache<unknown>();

export function getDefaultCache(): TtlCache<unknown> {
  return defaultCache;
}

/** Stats for the shared default cache instance (never includes secret values). */
export function cacheStats(): { size: number; hits: number; misses: number } {
  return defaultCache.stats();
}

/** Clear the shared default cache instance (for tests). */
export function clearCache(): void {
  defaultCache.clear();
}

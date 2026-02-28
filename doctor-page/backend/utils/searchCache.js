/**
 * Simple in-memory LRU cache for medicine search results.
 *
 * Why: Medicine data rarely changes. Caching popular searches
 * (e.g., "parac", "amox") dramatically reduces MongoDB load.
 *
 * TTL: 10 minutes. Max 200 entries.
 * In production, replace with Redis for multi-instance deployments.
 */

const MAX_SIZE = 200;
const TTL_MS = 10 * 60 * 1000; // 10 minutes

class SearchCache {
  constructor() {
    this.cache = new Map(); // preserves insertion order for LRU eviction
  }

  _key(query) {
    return query.toLowerCase().trim();
  }

  get(query) {
    const key = this._key(query);
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > TTL_MS) {
      this.cache.delete(key);
      return null;
    }
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.data;
  }

  set(query, data) {
    const key = this._key(query);
    // Evict oldest if at capacity
    if (this.cache.size >= MAX_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, { data, ts: Date.now() });
  }

  invalidate() {
    this.cache.clear();
  }

  get size() {
    return this.cache.size;
  }
}

module.exports = new SearchCache(); // singleton

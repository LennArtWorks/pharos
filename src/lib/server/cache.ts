/**
 * In-Memory RAM Cache for FSR-OS
 * Scoped per organisation to prevent data leaks between different FSRs.
 * Wipes completely if the Node.js server restarts.
 */

// src/lib/server/cache.ts
interface CacheEntry {
  data: any;
  expiresAt: number;
}

// Create a true Singleton using globalThis to bridge SvelteKit and server.js
const _global = globalThis as any;
if (!_global.__fsrMetaCache) {
  _global.__fsrMetaCache = new Map<string, CacheEntry>();
}

const metaCache: Map<string, CacheEntry> = _global.__fsrMetaCache;
const DEFAULT_TTL = 15 * 60 * 1000;

export function getMetaCache(orgId: string): any | null {
  const entry = metaCache.get(orgId);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    metaCache.delete(orgId);
    return null;
  }
  return entry.data;
}

export function setMetaCache(orgId: string, data: any, ttlMs: number = DEFAULT_TTL) {
  metaCache.set(orgId, { data, expiresAt: Date.now() + ttlMs });
}

export function clearMetaCache(orgId: string) {
  metaCache.delete(orgId);
}
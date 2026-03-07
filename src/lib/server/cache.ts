/**
 * In-Memory RAM Cache for FSR-OS
 * Scoped per organisation to prevent data leaks between different FSRs.
 * Wipes completely if the Node.js server restarts.
 */

interface CacheEntry {
  data: any;
  expiresAt: number;
}

// The actual RAM storage
const metaCache = new Map<string, CacheEntry>();

// Default TTL: 15 minutes in milliseconds
const DEFAULT_TTL = 15 * 60 * 1000;

export function getMetaCache(orgId: string): any | null {
  const entry = metaCache.get(orgId);

  if (!entry) return null;

  // Check if the cache has expired
  if (Date.now() > entry.expiresAt) {
    metaCache.delete(orgId); // Clean up old data
    return null;
  }

  return entry.data;
}

export function setMetaCache(orgId: string, data: any, ttlMs: number = DEFAULT_TTL) {
  metaCache.set(orgId, {
    data,
    expiresAt: Date.now() + ttlMs
  });
}

export function clearMetaCache(orgId: string) {
  metaCache.delete(orgId);
}
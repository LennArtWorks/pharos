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

// --- Meta Cache Functions ---

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

export function hasMetaCache(orgId: string): boolean {
  const entry = metaCache.get(orgId);
  return !!entry && Date.now() <= entry.expiresAt;
}

export function setMetaCache(orgId: string, data: any, ttlMs: number = DEFAULT_TTL) {
  metaCache.set(orgId, { data, expiresAt: Date.now() + ttlMs });
}

export function clearMetaCache(orgId: string) {
  metaCache.delete(orgId);
}

export function getMetaCacheStats() {
  const stats = [];
  for (const [orgId, entry] of metaCache.entries()) {
    stats.push({
      orgId,
      expiresAt: entry.expiresAt,
      isExpired: Date.now() > entry.expiresAt,
      nodeCount: entry.data?.nodes ? Object.keys(entry.data.nodes).length : 0
    });
  }
  return stats;
}

export function clearAllMetaCache() {
  metaCache.clear();
}

// --- Audit Cache Functions ---

if (!_global.__fsrAuditCache) {
  _global.__fsrAuditCache = new Map<string, string[]>();
}
const auditCache: Map<string, string[]> = _global.__fsrAuditCache;

export function pushAuditLog(orgId: string, logEntry: string) {
  const currentLogs = auditCache.get(orgId) || [];
  currentLogs.push(logEntry);
  auditCache.set(orgId, currentLogs);
}

export function popAuditLogs(orgId: string): string[] {
  const logs = auditCache.get(orgId) || [];
  auditCache.delete(orgId); // Clear the queue
  return logs;
}

export function peekAuditLogs(orgId: string): string[] {
  return auditCache.get(orgId) || [];
}
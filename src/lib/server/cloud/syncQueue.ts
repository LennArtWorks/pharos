// src/lib/server/cloud/syncQueue.ts
import { dev } from '$app/environment';
import { getCloudClient, type CloudConfig } from './origin/client';
import { getMetaCache, getDatesCache, popAuditLogs } from '../cache';
import { SYSTEM_CONFIG } from '$lib/config/filesystem';
import { GLOBAL_SETTINGS } from '$lib/config/globalsettings';

const syncTimers = new Map<string, NodeJS.Timeout>();

/**
 * 1. THE WRITE-BEHIND CACHE
 * Queues a background sync to WebDAV. Debounced to prevent API spam.
 */
export function queueCloudSync(orgConfig: App.Locals['orgConfig']) {
  if (!orgConfig) return;
  const orgId = orgConfig.organisation_id;

  if (syncTimers.has(orgId)) clearTimeout(syncTimers.get(orgId));

  const timer = setTimeout(async () => {
    syncTimers.delete(orgId);
    await performCloudSync(orgConfig);
  }, GLOBAL_SETTINGS.FILES.TREE_SYNC_DEBOUNCE_MS || 5000);

  syncTimers.set(orgId, timer);
}

async function performCloudSync(orgConfig: App.Locals['orgConfig']) {
  if (!orgConfig) return;
  const client = getCloudClient(orgConfig as CloudConfig);
  const orgId = orgConfig.organisation_id;

  try {
    // A. Flush meta.appsys
    const meta = getMetaCache(orgId);
    if (meta) {
      const metaPath = `/${SYSTEM_CONFIG.CONFIG_FOLDER}/${SYSTEM_CONFIG.META_FILE.join('')}`;
      await client.putFileContents(metaPath, JSON.stringify(meta, null, 2));
    }

    // B. Flush dates.appsys
    const dates = getDatesCache(orgId);
    if (dates) {
      const datesPath = `/${SYSTEM_CONFIG.CONFIG_FOLDER}/${SYSTEM_CONFIG.DATES_FILE.join('')}`;
      await client.putFileContents(datesPath, JSON.stringify(dates, null, 2));
    }

    // C. Flush Audit Logs
    const pendingLogs = popAuditLogs(orgId);
    if (pendingLogs.length > 0) {
      const logPath = `/${SYSTEM_CONFIG.CONFIG_FOLDER}/audit.log`;
      let existingLines: string[] = [];

      try {
        const rawContent = await client.getFileContents(logPath, { format: 'text' });
        existingLines = (rawContent as string).split('\n').filter(Boolean);
      } catch (e) {
        // File doesn't exist yet
      }

      // Combine, and slice to keep only the last 5000 lines (~1MB max)
      const MAX_LINES = 5000;
      const combinedLines = [...existingLines, ...pendingLogs.join('').split('\n').filter(Boolean)];
      const truncatedLines = combinedLines.slice(-MAX_LINES);

      const updatedLogs = truncatedLines.join('\n') + '\n';
      await client.putFileContents(logPath, updatedLogs);
    }

  } catch (error) {
    console.error(`[SyncQueue] WebDAV flush failed for org: ${orgId}`, error);
  }
}

/**
 * 2. THE REAL-TIME BROADCAST
 */
export function broadcastTreeUpdate(orgId: string) {
  if (dev) {
    console.log(`[DEV MODE] Skipping WebSocket broadcast for 'TREE_UPDATED' on org: ${orgId}`);
    return;
  }
}
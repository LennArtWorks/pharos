import { dev } from '$app/environment';
import { getCloudClient, type CloudConfig } from './origin/client';
import { getMetaCache } from '../cache';
import { SYSTEM_CONFIG } from '$lib/config/filesystem';
import { GLOBAL_SETTINGS } from '$lib/config/globalsettings';

const syncTimers = new Map<string, NodeJS.Timeout>();

/**
 * 1. THE WRITE-BEHIND CACHE
 * Queues a background sync to WebDAV. Debounced to prevent API spam.
 */
export function queueMetaSync(orgConfig: App.Locals['orgConfig']) {
  if (!orgConfig) return;
  const orgId = orgConfig.organisation_id;

  if (syncTimers.has(orgId)) clearTimeout(syncTimers.get(orgId));

  const timer = setTimeout(async () => {
    syncTimers.delete(orgId);
    await performMetaSync(orgConfig);
  }, GLOBAL_SETTINGS.FILES.TREE_SYNC_DEBOUNCE_MS || 5000);

  syncTimers.set(orgId, timer);
}

async function performMetaSync(orgConfig: App.Locals['orgConfig']) {
  if (!orgConfig) {
    console.warn('[SyncQueue] orgConfig is undefined, skipping meta sync');
    return;
  }
  try {
    const meta = getMetaCache(orgConfig.organisation_id);
    if (!meta) return;

    const client = getCloudClient(orgConfig as CloudConfig);
    const metaPath = `/${SYSTEM_CONFIG.CONFIG_FOLDER}/${SYSTEM_CONFIG.META_FILE.join('')}`;

    await client.putFileContents(metaPath, JSON.stringify(meta, null, 2));
    console.log(`[SyncQueue] Flushed meta.fsrsys to WebDAV for org: ${orgConfig.organisation_id}`);
  } catch (error) {
    console.error(`[SyncQueue] WebDAV flush failed for org: ${orgConfig.organisation_id}`, error);
  }
}

/**
 * 2. THE REAL-TIME BROADCAST
 * Notifies other users to update their UI. Bypassed in Dev Mode.
 */
export function broadcastTreeUpdate(orgId: string) {
  if (dev) {
    console.log(`[DEV MODE] Skipping WebSocket broadcast for 'TREE_UPDATED' on org: ${orgId}`);
    return;
  }

  // TODO: Add your WebSocket server emitter here later
  // e.g., global.wss.to(orgId).emit('TREE_UPDATED');
}
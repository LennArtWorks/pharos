/**
 * Server-side read/write service for dates.appsys.
 * Mirrors the cache-first pattern of service.ts (meta.appsys).
 */
import { getCloudClient, type CloudConfig } from './origin/client';
import { getDatesCache, setDatesCache } from '../cache';
import { SYSTEM_CONFIG, type AppDates, type FloatingDate } from '$lib/config/filesystem';
import { generateDefaultDatesIndex } from '$lib/config/cloudfiles/dates';

/**
 * Returns the full dates index, preferring the RAM cache.
 * On a cold cache it fetches from WebDAV; if the file doesn't exist yet it
 * returns a default empty index (does NOT write it — lazy initialisation).
 */
export async function getDatesIndex(orgConfig: App.Locals['orgConfig']): Promise<AppDates> {
  if (!orgConfig) throw new Error('No organization config provided to getDatesIndex');

  const cached = getDatesCache(orgConfig.organisation_id);
  if (cached) return cached;

  const client = getCloudClient(orgConfig as CloudConfig);
  const datesPath = `/${SYSTEM_CONFIG.CONFIG_FOLDER}/${SYSTEM_CONFIG.DATES_FILE.join('')}`;

  try {
    const content = await client.getFileContents(datesPath, { format: 'text' });
    const parsed: AppDates = JSON.parse(content as string);
    setDatesCache(orgConfig.organisation_id, parsed);
    return parsed;
  } catch (e: any) {
    if (e?.status === 404 || e?.message?.includes('404')) {
      console.warn(`[DatesService] dates.appsys not found at ${datesPath} — returning empty index`);
      return generateDefaultDatesIndex() as AppDates;
    }
    throw new Error('Failed to load dates index from cloud storage.');
  }
}

/**
 * Hydrates the raw lean record map into a typed FloatingDate array
 * by re-injecting the `id` key from the record key — identical to how
 * transformNodesToTree works for meta.appsys.
 */
export function hydrateDates(dates: AppDates['dates']): FloatingDate[] {
  return Object.entries(dates).map(([id, record]) => ({ ...record, id } as FloatingDate));
}

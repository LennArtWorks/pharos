import { json } from '@sveltejs/kit';
import { PERMISSIONS } from '$lib/config/permissions';
import { hasPermission } from '$lib/utils/config/permissions';
import { SYSTEM_CONFIG } from '$lib/config/filesystem';
import { getDatesIndex, hydrateDates } from '$lib/server/cloud/dates';
import { generateBaseAppDate } from '$lib/config/cloudfiles/dates';
import { setDatesCache } from '$lib/server/cache';
import { queueCloudSync } from '$lib/server/cloud/syncQueue';

/**
 * GET /api/dates
 * Returns all floating dates for the organisation as a hydrated FloatingDate[].
 */
export async function GET({ locals }) {
  if (!locals.orgConfig) {
    return json({ error: 'Unauthorized: Organisation not found' }, { status: 401 });
  }
  if (!hasPermission(locals.user!.role, PERMISSIONS.FILES.READ, locals.orgConfig.roles || {}, locals.user!.overrides || [])) {
    return json({ error: 'Forbidden.' }, { status: 403 });
  }

  try {
    const index = await getDatesIndex(locals.orgConfig);
    return json(hydrateDates(index.dates));
  } catch (e: any) {
    return json({ error: `Failed to load dates: ${e.message}` }, { status: 500 });
  }
}

/**
 * POST /api/dates
 * Body: {
 *   title: string,
 *   variant: DateVariant,
 *   timestamp: number,          // start (Unix ms)
 *   timestampEnd?: number,      // end (Unix ms) — standard variant only
 *   allDay?: boolean,           // defaults true
 *   description?: string,
 *   assignees?: string[],       // user IDs
 *   targetNodeId?: string
 * }
 * Creates a new floating date entry and queues a cloud sync.
 */
export async function POST({ request, locals }) {
  if (!locals.orgConfig || !locals.user) {
    return json({ error: 'Unauthorized: Organisation not found' }, { status: 401 });
  }
  if (!hasPermission(locals.user.role, PERMISSIONS.FILES.CREATE, locals.orgConfig.roles || {}, locals.user.overrides || [])) {
    return json({ error: 'Forbidden.' }, { status: 403 });
  }

  const body = await request.json();
  const { title, variant, timestamp, timestampEnd, allDay, description, location, link, tags, assignees, targetNodeId } = body;

  // --- Required field validation ---
  const cleanTitle = typeof title === 'string' ? title.trim().replace(/\0/g, '').substring(0, 255) : '';
  if (!cleanTitle) return json({ error: 'title is required' }, { status: 400 });

  const validVariants = ['standard', 'start', 'deadline'] as const;
  if (!variant || !validVariants.includes(variant)) {
    return json({ error: `variant must be one of: ${validVariants.join(', ')}` }, { status: 400 });
  }
  if (typeof timestamp !== 'number' || !isFinite(timestamp)) {
    return json({ error: 'timestamp must be a finite number (Unix ms)' }, { status: 400 });
  }

  // --- Optional field validation ---
  if (timestampEnd !== undefined) {
    if (variant !== 'standard') {
      return json({ error: 'timestampEnd is only valid for variant "standard"' }, { status: 400 });
    }
    if (typeof timestampEnd !== 'number' || !isFinite(timestampEnd) || timestampEnd <= timestamp) {
      return json({ error: 'timestampEnd must be a finite number greater than timestamp' }, { status: 400 });
    }
  }
  if (assignees !== undefined && (!Array.isArray(assignees) || assignees.some(a => typeof a !== 'string'))) {
    return json({ error: 'assignees must be an array of strings' }, { status: 400 });
  }

  try {
    const index = await getDatesIndex(locals.orgConfig);
    if (!index.dates) (index as any).dates = {};

    const rawId = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    const id = SYSTEM_CONFIG.ID_PREFIX ? `${SYSTEM_CONFIG.ID_PREFIX}_${rawId}` : rawId;

    index.dates[id] = generateBaseAppDate({
      title: cleanTitle,
      variant,
      timestamp,
      timestampEnd,
      allDay: allDay ?? true,
      description: typeof description === 'string' ? description.substring(0, 2000) : undefined,
      location: typeof location === 'string' ? location.substring(0, 500) : undefined,
      link: typeof link === 'string' ? link.substring(0, 500) : undefined,
      tags: Array.isArray(tags) ? tags.filter((t: unknown) => typeof t === 'string').map((t: string) => t.substring(0, 100)) : undefined,
      assignees,
      targetNodeId
    });
    index._meta.lastUpdated = Date.now();

    setDatesCache(locals.orgConfig.organisation_id, index);
    queueCloudSync(locals.orgConfig);

    return json({ success: true, id });
  } catch (e: any) {
    console.error('[Dates API] POST error:', e);
    return json({ error: 'Failed to create date' }, { status: 500 });
  }
}

import { json } from '@sveltejs/kit';
import { PERMISSIONS } from '$lib/config/permissions';
import { hasPermission } from '$lib/utils/config/permissions';
import { getDatesIndex } from '$lib/server/cloud/dates';
import { setDatesCache } from '$lib/server/cache';
import { queueCloudSync } from '$lib/server/cloud/syncQueue';

/**
 * POST /api/dates/delete
 * Body: { id: string }
 * Removes a floating date entry by ID.
 */
export async function POST({ request, locals }) {
  if (!locals.orgConfig || !locals.user) {
    return json({ error: 'Unauthorized: Organisation not found' }, { status: 401 });
  }
  if (!hasPermission(locals.user.role, PERMISSIONS.FILES.DELETE, locals.orgConfig.roles || {}, locals.user.overrides || [])) {
    return json({ error: 'Forbidden.' }, { status: 403 });
  }

  const { id } = await request.json();
  if (!id || typeof id !== 'string') {
    return json({ error: 'id is required' }, { status: 400 });
  }

  try {
    const index = await getDatesIndex(locals.orgConfig);

    if (!index.dates[id]) {
      return json({ error: 'Date not found' }, { status: 404 });
    }

    delete index.dates[id];
    index._meta.lastUpdated = Date.now();

    setDatesCache(locals.orgConfig.organisation_id, index);
    queueCloudSync(locals.orgConfig);

    return json({ success: true });
  } catch (e: any) {
    console.error('[Dates API] DELETE error:', e);
    return json({ error: 'Failed to delete date' }, { status: 500 });
  }
}

import { json } from '@sveltejs/kit';
import { PERMISSIONS } from '$lib/config/permissions';
import { hasPermission } from '$lib/utils/config/permissions';
import { getDatesIndex } from '$lib/server/cloud/dates';
import { setDatesCache } from '$lib/server/cache';
import { queueCloudSync } from '$lib/server/cloud/syncQueue';
import type { DateVariant } from '$lib/config/filesystem';

/**
 * POST /api/dates/update
 * Body: { id: string, title?: string, variant?: DateVariant, timestamp?: number, targetNodeId?: string }
 * Applies a partial update to an existing floating date.
 */
export async function POST({ request, locals }) {
  if (!locals.orgConfig || !locals.user) {
    return json({ error: 'Unauthorized: Organisation not found' }, { status: 401 });
  }
  if (!hasPermission(locals.user.role, PERMISSIONS.FILES.EDIT, locals.orgConfig.roles || {}, locals.user.overrides || [])) {
    return json({ error: 'Forbidden.' }, { status: 403 });
  }

  const body = await request.json();
  const { id, title, variant, timestamp, timestampEnd, allDay, description, location, link, tags, assignees, targetNodeId } = body;

  if (!id || typeof id !== 'string') {
    return json({ error: 'id is required' }, { status: 400 });
  }

  // Validate optional fields only when present
  const validVariants: DateVariant[] = ['standard', 'start', 'deadline'];
  if (variant !== undefined && !validVariants.includes(variant)) {
    return json({ error: `variant must be one of: ${validVariants.join(', ')}` }, { status: 400 });
  }
  if (timestamp !== undefined && (typeof timestamp !== 'number' || !isFinite(timestamp))) {
    return json({ error: 'timestamp must be a finite number (Unix ms)' }, { status: 400 });
  }
  if (timestampEnd !== undefined && (typeof timestampEnd !== 'number' || !isFinite(timestampEnd))) {
    return json({ error: 'timestampEnd must be a finite number (Unix ms)' }, { status: 400 });
  }
  if (assignees !== undefined && (!Array.isArray(assignees) || assignees.some((a: unknown) => typeof a !== 'string'))) {
    return json({ error: 'assignees must be an array of strings' }, { status: 400 });
  }

  try {
    const index = await getDatesIndex(locals.orgConfig);
    const existing = index.dates[id];

    if (!existing) {
      return json({ error: 'Date not found' }, { status: 404 });
    }

    // Resolve the effective variant (may be changing in this request)
    const effectiveVariant = variant ?? existing.variant;

    // Apply only the fields that were explicitly passed
    if (title !== undefined) {
      const cleanTitle = String(title).trim().replace(/\0/g, '').substring(0, 255);
      if (!cleanTitle) return json({ error: 'title cannot be empty' }, { status: 400 });
      existing.title = cleanTitle;
    }
    if (variant !== undefined) {
      existing.variant = variant;
      // Clear timestampEnd if switching away from standard variant
      if (variant !== 'standard') delete existing.timestampEnd;
    }
    if (timestamp !== undefined) existing.timestamp = timestamp;
    if (timestampEnd !== undefined) {
      if (effectiveVariant !== 'standard') {
        return json({ error: 'timestampEnd is only valid for variant "standard"' }, { status: 400 });
      }
      existing.timestampEnd = timestampEnd;
    }
    // Allow explicit null to clear timestampEnd
    if (body.timestampEnd === null && effectiveVariant === 'standard') delete existing.timestampEnd;

    if (allDay !== undefined) existing.allDay = Boolean(allDay);
    if (description !== undefined) {
      existing.description = typeof description === 'string' ? description.substring(0, 2000) : undefined;
    }
    if (location !== undefined) {
      existing.location = typeof location === 'string' ? location.substring(0, 500) : undefined;
    }
    if (link !== undefined) {
      existing.link = typeof link === 'string' ? link.substring(0, 500) : undefined;
    }
    if (tags !== undefined) {
      existing.tags = Array.isArray(tags) ? tags.filter((t: unknown) => typeof t === 'string').map((t: string) => t.substring(0, 100)) : undefined;
    }
    if (assignees !== undefined) existing.assignees = assignees;
    if (targetNodeId !== undefined) existing.targetNodeId = targetNodeId;

    index._meta.lastUpdated = Date.now();

    setDatesCache(locals.orgConfig.organisation_id, index);
    queueCloudSync(locals.orgConfig);

    return json({ success: true });
  } catch (e: any) {
    console.error('[Dates API] UPDATE error:', e);
    return json({ error: 'Failed to update date' }, { status: 500 });
  }
}

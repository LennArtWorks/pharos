import { json } from '@sveltejs/kit';
import { PERMISSIONS } from '$lib/config/permissions';
import { hasPermission } from '$lib/utils/config/permissions';
import { getFileSystemMeta } from '$lib/server/cloud/service';
import { setMetaCache } from '$lib/server/cache';
import { queueCloudSync } from '$lib/server/cloud/syncQueue';
import { logOrganisationAction } from '$lib/server/audit';

/**
 * POST /api/filesystem/assign
 * Body: { nodeId: string; assignees: string[] }
 *
 * Permission rules:
 *   - Self-assign (own ID only): any authenticated user
 *   - Assign others: requires FILES.EDIT
 */
export async function POST({ request, locals }) {
  if (!locals.orgConfig || !locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { nodeId, assignees } = body;

  if (!nodeId || typeof nodeId !== 'string') return json({ error: 'nodeId is required' }, { status: 400 });
  if (!Array.isArray(assignees) || assignees.some((a: unknown) => typeof a !== 'string')) {
    return json({ error: 'assignees must be an array of strings' }, { status: 400 });
  }

  const currentUserId = locals.user.id;
  const isOnlySelfChange = assignees.every((id: string) => id === currentUserId);
  const canEditOthers = hasPermission(locals.user.role, PERMISSIONS.FILES.EDIT, locals.orgConfig.roles || {}, locals.user.overrides || []);

  if (!isOnlySelfChange && !canEditOthers) {
    return json({ error: 'Permission denied. FILES.EDIT required to assign others.' }, { status: 403 });
  }

  try {
    const meta = await getFileSystemMeta(locals.orgConfig);
    if (!meta.nodes[nodeId]) return json({ error: 'Node not found' }, { status: 404 });

    meta.nodes[nodeId].assignees = assignees.length > 0 ? assignees : undefined;
    meta._meta.lastUpdated = Date.now();
    setMetaCache(locals.orgConfig.organisation_id, meta);
    queueCloudSync(locals.orgConfig);

    logOrganisationAction(
      locals.orgConfig.organisation_id,
      currentUserId,
      'NODE_ASSIGN',
      `Updated assignees on ${nodeId}: [${assignees.join(', ')}]`
    );

    return json({ success: true });
  } catch {
    return json({ error: 'Failed to update assignees' }, { status: 500 });
  }
}

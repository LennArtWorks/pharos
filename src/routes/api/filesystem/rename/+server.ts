import { json } from '@sveltejs/kit';
import { PERMISSIONS } from '$lib/config/permissions';
import { hasPermission } from '$lib/utils/config/permissions';
import { getFileSystemMeta } from '$lib/server/cloud/service';
import { setMetaCache } from '$lib/server/cache';
import { queueMetaSync } from '$lib/server/cloud/syncQueue';

export async function POST({ request, locals }) {
  if (!locals.orgConfig || !locals.user) return json({ error: 'Organization not found' }, { status: 400 });
  if (!hasPermission(locals.user.role, PERMISSIONS.FILES.EDIT, locals.orgConfig.roles || {}, locals.user.overrides || [])) {
    return json({ error: 'Permission denied.' }, { status: 403 });
  }

  const { id, newName } = await request.json();

  try {
    const meta = await getFileSystemMeta(locals.orgConfig);
    if (!meta.nodes[id]) return json({ error: 'Not found' }, { status: 404 });

    meta.nodes[id].name = newName.trim();
    meta._meta.lastUpdated = Date.now();
    setMetaCache(locals.orgConfig.organisation_id, meta);

    queueMetaSync(locals.orgConfig);

    return json({ success: true });
  } catch (error) {
    return json({ error: 'Failed to rename item' }, { status: 500 });
  }
}
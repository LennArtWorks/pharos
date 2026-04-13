import { json } from '@sveltejs/kit';
import { PERMISSIONS } from '$lib/config/permissions';
import { hasPermission } from '$lib/utils/config/permissions';
import { getFileSystemMeta } from '$lib/server/cloud/service';
import { setMetaCache } from '$lib/server/cache';
import { queueCloudSync } from '$lib/server/cloud/syncQueue';
import { logOrganisationAction } from '$lib/server/audit';

export async function POST({ request, locals }) {
  if (!locals.orgConfig || !locals.user) return json({ error: 'Organization not found' }, { status: 400 });
  if (!hasPermission(locals.user.role, PERMISSIONS.FILES.EDIT, locals.orgConfig.roles || {}, locals.user.overrides || [])) {
    return json({ error: 'Permission denied.' }, { status: 403 });
  }

  const { id, newName } = await request.json();

  if (!id || typeof id !== 'string') return json({ error: 'Invalid id' }, { status: 400 });
  const cleanName = typeof newName === 'string' ? newName.trim().replace(/\0/g, '') : '';
  if (!cleanName || cleanName.length > 255) return json({ error: 'Name must be 1–255 characters' }, { status: 400 });

  try {
    const meta = await getFileSystemMeta(locals.orgConfig);
    if (!meta.nodes[id]) return json({ error: 'Not found' }, { status: 404 });

    meta.nodes[id].name = cleanName;
    meta._meta.lastUpdated = Date.now();
    setMetaCache(locals.orgConfig.organisation_id, meta);

    queueCloudSync(locals.orgConfig);

    logOrganisationAction(
      locals.orgConfig.organisation_id,
      locals.user.id,
      'FILE_RENAME',
      `Renamed ${id} to "${cleanName}"`
    );
    queueCloudSync(locals.orgConfig);

    return json({ success: true });
  } catch (error) {
    return json({ error: 'Failed to rename item' }, { status: 500 });
  }
}
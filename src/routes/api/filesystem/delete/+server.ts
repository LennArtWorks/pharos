import { json } from '@sveltejs/kit';
import { getCloudClient, type CloudConfig } from '$lib/server/cloud/origin/client';
import { SYSTEM_CONFIG } from '$lib/config/filesystem';
import { PERMISSIONS } from '$lib/config/permissions';
import { hasPermission } from '$lib/utils/config/permissions';
import { getFileSystemMeta, resolvePhysicalPath } from '$lib/server/cloud/service';
import { setMetaCache } from '$lib/server/cache';
import { queueCloudSync, broadcastTreeUpdate } from '$lib/server/cloud/syncQueue';
import { logOrganisationAction } from '$lib/server/audit';

export async function POST({ request, locals }) {
  if (!locals.orgConfig || !locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(locals.user.role, PERMISSIONS.FILES.DELETE, locals.orgConfig.roles || {}, locals.user.overrides || [])) {
    return json({ error: 'Permission denied.' }, { status: 403 });
  }

  const { id } = await request.json();

  try {
    const meta = await getFileSystemMeta(locals.orgConfig);
    if (!meta.nodes[id]) return json({ error: 'Node not found' }, { status: 404 });

    const client = getCloudClient(locals.orgConfig as CloudConfig);
    const physicalPath = await resolvePhysicalPath(locals.orgConfig, id);

    if (physicalPath) {
      const trashDir = `/${SYSTEM_CONFIG.HIDDEN_PREFIXES[0]}trash`;
      if (await client.exists(trashDir) === false) await client.createDirectory(trashDir);

      const filename = physicalPath.split('/').pop();
      await client.moveFile(physicalPath, `${trashDir}/${filename}`);
    }

    function deleteRecursive(targetId: string) {
      delete meta.nodes[targetId];
      for (const [key, node] of Object.entries(meta.nodes)) {
        if ((node as any).parentId === targetId) deleteRecursive(key);
      }
    }
    deleteRecursive(id);

    meta._meta.lastUpdated = Date.now();
    setMetaCache(locals.orgConfig.organisation_id, meta);

    queueCloudSync(locals.orgConfig);
    broadcastTreeUpdate(locals.orgConfig.organisation_id);

    const nodeName = meta.nodes[id]?.name || 'Unknown';
    logOrganisationAction(
      locals.orgConfig.organisation_id,
      locals.user.id,
      'FILE_DELETE',
      `Moved "${nodeName}" (${id}) to trash`
    );

    return json({ success: true });
  } catch (error: any) {
    return json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
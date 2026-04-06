import { json } from '@sveltejs/kit';
import { getCloudClient, type CloudConfig } from '$lib/server/cloud/origin/client';
import { PERMISSIONS } from '$lib/config/permissions';
import { hasPermission } from '$lib/utils/config/permissions';
import { getFileSystemMeta, resolvePhysicalPath } from '$lib/server/cloud/service';
import { setMetaCache } from '$lib/server/cache';
import { queueCloudSync, broadcastTreeUpdate } from '$lib/server/cloud/syncQueue';
import { logOrganisationAction } from '$lib/server/audit';

export async function POST({ request, locals }) {
  if (!locals.orgConfig || !locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(locals.user.role, PERMISSIONS.FILES.EDIT, locals.orgConfig.roles || {}, locals.user.overrides || [])) {
    return json({ error: 'Permission denied.' }, { status: 403 });
  }

  const { draggedId, targetId, action } = await request.json();

  try {
    const meta = await getFileSystemMeta(locals.orgConfig);
    const draggedNode = meta.nodes[draggedId];
    const targetNode = meta.nodes[targetId];

    if (!draggedNode || !targetNode) return json({ error: 'Nodes not found' }, { status: 404 });

    const oldParentId = draggedNode.parentId;
    let newParentId = action === 'inside' ? targetId : targetNode.parentId;

    // 1. PHYSICAL OPERATION
    if (oldParentId !== newParentId) {
      const client = getCloudClient(locals.orgConfig as CloudConfig);
      const oldPhysicalPath = await resolvePhysicalPath(locals.orgConfig, draggedId);
      const newParentPath = newParentId ? (await resolvePhysicalPath(locals.orgConfig, newParentId) || '') : '';

      if (oldPhysicalPath) {
        const filename = oldPhysicalPath.split('/').pop();
        const newPhysicalPath = `/${newParentPath}/${filename}`.replace(/\/+/g, '/');

        if (oldPhysicalPath !== newPhysicalPath) {
          await client.moveFile(oldPhysicalPath, newPhysicalPath);
        }
      }
    }

    // 2. LOGICAL OPERATION
    draggedNode.parentId = newParentId;

    if (action !== 'inside') {
      const newNodes: Record<string, any> = {};
      const filteredEntries = Object.entries(meta.nodes).filter(([id]) => id !== draggedId);

      for (const [id, node] of filteredEntries) {
        if (id === targetId && action === 'before') newNodes[draggedId] = draggedNode;
        newNodes[id] = node;
        if (id === targetId && action === 'after') newNodes[draggedId] = draggedNode;
      }
      meta.nodes = newNodes;
    }

    // 3. CACHE & SYNC
    meta._meta.lastUpdated = Date.now();
    setMetaCache(locals.orgConfig.organisation_id, meta);
    queueCloudSync(locals.orgConfig);
    broadcastTreeUpdate(locals.orgConfig.organisation_id);

    const draggedName = draggedNode.name || 'Unknown';
    const targetName = targetNode.name || 'root';
    logOrganisationAction(
      locals.orgConfig.organisation_id,
      locals.user.id,
      'FILE_MOVE',
      `Moved "${draggedName}" (${draggedId}) ${action} "${targetName}" (${targetId})`
    );

    return json({ success: true });
  } catch (error: any) {
    return json({ error: 'Failed to move file on cloud.' }, { status: 500 });
  }
}
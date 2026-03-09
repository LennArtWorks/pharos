import { json } from '@sveltejs/kit';
import { getCloudClient, type CloudConfig } from '$lib/server/cloud/origin/client';
import { FILE_TYPE_CONFIG, SYSTEM_CONFIG, getFileConfig } from '$lib/config/filesystem';
import { PERMISSIONS, hasPermission } from '$lib/config/permissions';
import { getFileSystemMeta } from '$lib/server/cloud/service';
import { setMetaCache } from '$lib/server/cache';

export async function POST({ request, locals }) {
  if (!locals.orgConfig) return json({ error: 'Organization not found' }, { status: 400 });

  // 1. SECURITY CHECK
  if (!locals.user || !hasPermission(locals.user.role, PERMISSIONS.FILES.EDIT, locals.orgConfig.roles || {})) {
    return json({ error: 'Permission denied. You cannot edit files.' }, { status: 403 });
  }

  const { id, newName } = await request.json();

  if (!id || !newName || newName.trim() === '') {
    return json({ error: 'Invalid payload' }, { status: 400 });
  }

  try {
    // 2. Fetch from Cache/Cloud using our service
    const existingMeta = await getFileSystemMeta(locals.orgConfig);

    if (!existingMeta.nodes[id]) return json({ error: 'Not found' }, { status: 404 });

    // 3. Determine type dynamically from extension to check permissions
    const nodeConfig = getFileConfig(existingMeta.nodes[id].extension);
    if (nodeConfig.type === 'workspace' && !hasPermission(locals.user.role, PERMISSIONS.WORKSPACE.EDIT, locals.orgConfig.roles || {})) {
      return json({ error: 'Permission denied. You cannot rename workspaces.' }, { status: 403 });
    }

    // 4. Update the logical name
    existingMeta.nodes[id].name = newName.trim();
    existingMeta._meta.lastUpdated = Date.now();

    // 5. Save back to Cloud
    const client = getCloudClient(locals.orgConfig as CloudConfig);
    const metaPath = `/${SYSTEM_CONFIG.CONFIG_FOLDER}/${SYSTEM_CONFIG.META_FILE.join('')}`;

    await client.putFileContents(metaPath, JSON.stringify(existingMeta, null, 2));

    // 6. Update the RAM Cache instantly
    setMetaCache(locals.orgConfig.organisation_id, existingMeta);

    return json({ success: true, updatedNode: existingMeta.nodes[id] });
  } catch (error) {
    console.error('Rename error:', error);
    return json({ error: 'Failed to rename item' }, { status: 500 });
  }
}
import { json } from '@sveltejs/kit';
import { getCloudClient } from '$lib/server/cloud/client';
import { SYSTEM_CONFIG, type FSRMeta } from '$lib/config/filesystem';
import { PERMISSIONS, hasPermission } from '$lib/config/permissions';

export async function POST({ request, locals }) {
  if (!locals.orgConfig) return json({ error: 'Organization not found' }, { status: 400 });

  // 1. SECURITY CHECK: Pass the active roles from locals
  if (!locals.user || !hasPermission(locals.user.role, PERMISSIONS.FILES.EDIT, locals.orgConfig.roles || {})) {
    return json({ error: 'Permission denied. You cannot edit files.' }, { status: 403 });
  }

  const { id, newName } = await request.json();

  if (!id || !newName || newName.trim() === '') {
    return json({ error: 'Invalid payload' }, { status: 400 });
  }

  // 2. Setup Cloud Connection (Now Storage Agnostic!)
  const client = getCloudClient(locals.orgConfig);

  const rootPath = locals.orgConfig.cloud_directory.startsWith('/') ? locals.orgConfig.cloud_directory : `/${locals.orgConfig.cloud_directory}`;
  const metaPath = `${rootPath}/${SYSTEM_CONFIG.CONFIG_FOLDER}/${SYSTEM_CONFIG.META_FILENAME}${SYSTEM_CONFIG.EXTENSIONS.SYSTEM_FILE}`;

  try {
    const raw = await client.getFileContents(metaPath, { format: "text" });
    const existingMeta: FSRMeta = JSON.parse(raw as string);

    if (!existingMeta.nodes[id]) return json({ error: 'Not found' }, { status: 404 });

    if (existingMeta.nodes[id].type === 'workspace' && !hasPermission(locals.user.role, PERMISSIONS.WORKSPACE.EDIT, locals.orgConfig.roles || {})) {
      return json({ error: 'Permission denied. You cannot rename workspaces.' }, { status: 403 });
    }

    existingMeta.nodes[id].name = newName.trim();
    existingMeta._meta.lastUpdated = Date.now();

    await client.putFileContents(metaPath, JSON.stringify(existingMeta, null, 2));

    return json({ success: true, updatedNode: existingMeta.nodes[id] });
  } catch (error) {
    console.error('Rename error:', error);
    return json({ error: 'Failed to rename item' }, { status: 500 });
  }
}
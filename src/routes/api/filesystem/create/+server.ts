import { json } from '@sveltejs/kit';
import { getCloudClient, type CloudConfig } from '$lib/server/cloud/origin/client';
import { SYSTEM_CONFIG, FILE_TYPE_CONFIG } from '$lib/config/filesystem';
import { PERMISSIONS } from '$lib/config/permissions';
import { hasPermission } from '$lib/utils/config/permissions';
import { getFileSystemMeta, resolvePhysicalPath } from '$lib/server/cloud/service';
import { writeSecureFile } from '$lib/server/auth/secureHandler';
import { setMetaCache } from '$lib/server/cache';
import { queueCloudSync, broadcastTreeUpdate } from '$lib/server/cloud/syncQueue';
import { buildNodeFilename } from '$lib/utils/config/filesystem';
import { generateBaseNode } from '$lib/config/cloudfiles/meta';
import { logOrganisationAction } from '$lib/server/audit';

export async function POST({ request, locals }) {
  if (!locals.orgConfig || !locals.user) return json({ error: 'Organization not found' }, { status: 400 });
  if (!hasPermission(locals.user.role, PERMISSIONS.FILES.CREATE, locals.orgConfig.roles || {}, locals.user.overrides || [])) {
    return json({ error: 'Permission denied.' }, { status: 403 });
  }

  const { type, parentId, name } = await request.json();

  // Validate type against the known internal type keys to prevent arbitrary injection
  const validTypes = Object.keys(FILE_TYPE_CONFIG.internal) as (keyof typeof FILE_TYPE_CONFIG.internal)[];
  if (!type || !validTypes.includes(type)) return json({ error: 'Unknown file type' }, { status: 400 });

  const cleanName = typeof name === 'string' ? name.trim().replace(/\0/g, '').substring(0, 255) : '';
  if (!cleanName) return json({ error: 'Name is required' }, { status: 400 });

  const _rawId = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
  const id = SYSTEM_CONFIG.ID_PREFIX ? `${SYSTEM_CONFIG.ID_PREFIX}_${_rawId}` : _rawId;
  const typeConfig = FILE_TYPE_CONFIG.internal[type as keyof typeof FILE_TYPE_CONFIG.internal];

  try {
    const meta = await getFileSystemMeta(locals.orgConfig);
    const client = getCloudClient(locals.orgConfig as CloudConfig);
    const isSecure = false;

    // 1. PHYSICAL OPERATION
    let parentPath = parentId ? (await resolvePhysicalPath(locals.orgConfig, parentId) || '') : '';
    const physicalName = buildNodeFilename(id, typeConfig.ext[0], { isSecure });
    const fullPath = `/${parentPath}/${physicalName}`.replace(/\/+/g, '/');

    // THE FIX: Workspaces and Folders MUST be physical WebDAV directories, not JSON files!
    if (typeConfig.type === 'workspace' || typeConfig.type === 'folder') {
      await client.createDirectory(fullPath);
    } else {
      const defaultContent = typeConfig.defaultContent || {};
      if (isSecure) {
        await writeSecureFile(locals.orgConfig, fullPath, defaultContent);
      } else {
        await client.putFileContents(fullPath, JSON.stringify(defaultContent, null, 2));
      }
    }

    // 2. LOGICAL OPERATION
    meta.nodes[id] = generateBaseNode(cleanName, parentId || null, typeConfig.ext[0], isSecure, false);

    meta._meta.lastUpdated = Date.now();
    setMetaCache(locals.orgConfig.organisation_id, meta);

    // 3. AUDIT LOGGING
    const actionName = typeConfig.type === 'workspace' ? 'WORKSPACE_CREATE' : 'FILE_CREATE';
    logOrganisationAction(
      locals.orgConfig.organisation_id,
      locals.user.id,
      actionName,
      `Created ${type} "${cleanName}" (${id}) in parent ${parentId || 'root'}`
    );

    // 4. BACKGROUND TASKS
    queueCloudSync(locals.orgConfig);
    broadcastTreeUpdate(locals.orgConfig.organisation_id);

    return json({ success: true, id });
  } catch (error: any) {
    console.error("[Create API Error]", error);
    return json({ error: 'Failed to create item' }, { status: 500 });
  }
}
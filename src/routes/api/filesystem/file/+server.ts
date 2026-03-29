import { json } from '@sveltejs/kit';
import { getCloudClient, type CloudConfig } from '$lib/server/cloud/origin/client';
import { getFileSystemMeta, resolvePhysicalPath } from '$lib/server/cloud/service';
import { readJsonDocument, writeJsonDocument } from '$lib/server/cloud/filetypes/json';
import { readSecureFile, writeSecureFile } from '$lib/server/auth/secureHandler';
import { PERMISSIONS } from '$lib/config/permissions';
import { hasPermission } from '$lib/utils/config/permissions';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'Missing file ID' }, { status: 400 });

  const orgConfig = locals.orgConfig;
  if (!orgConfig || !locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

  // SECURITY: Check if they can read files
  if (!hasPermission(locals.user.role, PERMISSIONS.FILES.READ, orgConfig.roles || {}, locals.user.overrides || [])) {
    return json({ error: 'Permission denied.' }, { status: 403 });
  }

  try {
    const meta = await getFileSystemMeta(orgConfig);
    const node = meta.nodes[id];
    if (!node) return json({ error: 'Node not found in index' }, { status: 404 });

    const physicalPath = await resolvePhysicalPath(orgConfig, id);
    if (!physicalPath) return json({ error: 'Could not resolve physical path' }, { status: 404 });

    let documentData;
    if (node.isSecure) {
      documentData = await readSecureFile(orgConfig, physicalPath);
    } else {
      const client = getCloudClient(orgConfig as CloudConfig);
      documentData = await readJsonDocument(client, physicalPath);
    }

    return json({ data: documentData });
  } catch (error: any) {
    return json({ error: error.message }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const orgConfig = locals.orgConfig;
  if (!orgConfig || !locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

  // SECURITY: Check if they can edit files
  if (!hasPermission(locals.user.role, PERMISSIONS.FILES.EDIT, orgConfig.roles || {}, locals.user.overrides || [])) {
    return json({ error: 'Permission denied.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, content } = body;

    if (!id || content === undefined) return json({ error: 'Invalid payload' }, { status: 400 });

    const meta = await getFileSystemMeta(orgConfig);
    const node = meta.nodes[id];
    if (!node) return json({ error: 'Node not found in index' }, { status: 404 });

    const physicalPath = await resolvePhysicalPath(orgConfig, id);
    if (!physicalPath) return json({ error: 'Could not resolve physical path' }, { status: 404 });

    if (node.isSecure) {
      await writeSecureFile(orgConfig, physicalPath, content);
    } else {
      const client = getCloudClient(orgConfig as CloudConfig);
      await writeJsonDocument(client, physicalPath, content);
    }

    return json({ success: true, id });
  } catch (error: any) {
    return json({ error: error.message }, { status: 500 });
  }
};
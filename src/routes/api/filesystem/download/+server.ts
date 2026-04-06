// src/routes/api/filesystem/download/+server.ts
import { error } from '@sveltejs/kit';
import { getCloudClient, type CloudConfig } from '$lib/server/cloud/origin/client';
import { getFileSystemMeta, resolvePhysicalPath } from '$lib/server/cloud/service';
import { PERMISSIONS } from '$lib/config/permissions';
import { hasPermission } from '$lib/utils/config/permissions';
import { logOrganisationAction } from '$lib/server/audit';
import { queueCloudSync } from '$lib/server/cloud/syncQueue';
import { Readable } from 'stream';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
  const id = url.searchParams.get('id');
  if (!id) throw error(400, 'Missing file ID');

  const orgConfig = locals.orgConfig;
  if (!orgConfig || !locals.user) throw error(401, 'Unauthorized');

  // STRICT PERMISSION CHECK ADDED
  if (!hasPermission(locals.user.role, PERMISSIONS.FILES.READ, orgConfig.roles || {}, locals.user.overrides || [])) {
    throw error(403, 'Permission denied. Cannot download files.');
  }

  try {
    const meta = await getFileSystemMeta(orgConfig);
    const node = meta.nodes[id];

    if (!node) throw error(404, 'File not found in index');

    const physicalPath = await resolvePhysicalPath(orgConfig, id);
    if (!physicalPath) throw error(404, 'Could not resolve file path');

    const client = getCloudClient(orgConfig as CloudConfig);

    const nodeStream = client.createReadStream(physicalPath);
    const webStream = Readable.toWeb(nodeStream);
    const downloadName = `${node.name}${node.extension || ''}`;

    // Log the download action and trigger sync
    logOrganisationAction(
      orgConfig.organisation_id,
      locals.user.id,
      'FILE_DOWNLOAD',
      `Downloaded file: ${downloadName} (${id})`
    );
    queueCloudSync(orgConfig);

    return new Response(webStream as any, {
      headers: {
        'Content-Disposition': `attachment; filename="${encodeURIComponent(downloadName)}"`,
        'Content-Type': 'application/octet-stream'
      }
    });

  } catch (e: any) {
    console.error('[Download Route Error]:', e);
    throw error(500, e.message || 'Failed to start download');
  }
};
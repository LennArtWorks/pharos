import { error } from '@sveltejs/kit';
import { getCloudClient, type CloudConfig } from '$lib/server/cloud/origin/client';
import { getFileSystemMeta } from '$lib/server/cloud/service';
import { Readable } from 'stream';
import type { RequestHandler } from './$types';

// Helper to climb the tree and build the Sciebo path (identical to the one in your file route)
async function resolvePhysicalPath(orgConfig: App.Locals['orgConfig'], nodeId: string): Promise<string | null> {
  if (!orgConfig) return null;

  const meta = await getFileSystemMeta(orgConfig);
  if (!meta.nodes || !meta.nodes[nodeId]) return null;

  let currentId: string | null = nodeId;
  const pathParts: string[] = [];

  while (currentId && meta.nodes[currentId]) {
    const currentNode: any = meta.nodes[currentId];
    pathParts.unshift(`${currentId}${currentNode.extension}`);
    currentId = currentNode.parentId;
  }

  const fullPath = pathParts.join('/');
  return `/${orgConfig.cloud_directory}/${fullPath}`.replace(/\/+/g, '/');
}

export const GET: RequestHandler = async ({ url, locals }) => {
  const id = url.searchParams.get('id');
  if (!id) throw error(400, 'Missing file ID');

  const orgConfig = locals.orgConfig;
  if (!orgConfig) throw error(401, 'Unauthorized');

  try {
    const meta = await getFileSystemMeta(orgConfig);
    const node = meta.nodes[id];

    if (!node) throw error(404, 'File not found in index');

    const physicalPath = await resolvePhysicalPath(orgConfig, id);
    if (!physicalPath) throw error(404, 'Could not resolve file path');

    const client = getCloudClient(orgConfig as CloudConfig);

    // 1. Create a Node.js ReadStream directly from WebDAV
    const nodeStream = client.createReadStream(physicalPath);

    // 2. Convert the Node Stream to a Web Standard ReadableStream (required by SvelteKit)
    const webStream = Readable.toWeb(nodeStream);

    // 3. Construct the human-readable filename for the user's download prompt
    const downloadName = `${node.name}${node.extension || ''}`;

    // 4. Return the streaming response!
    return new Response(webStream as any, {
      headers: {
        // This header forces the browser to download the file instead of trying to open it
        'Content-Disposition': `attachment; filename="${encodeURIComponent(downloadName)}"`,
        'Content-Type': 'application/octet-stream' // Generic binary type
      }
    });

  } catch (e: any) {
    console.error('[Download Route Error]:', e);
    throw error(500, e.message || 'Failed to start download');
  }
};
import { json } from '@sveltejs/kit';
import { getCloudClient, type CloudConfig } from '$lib/server/cloud/origin/client';
import { getFileSystemMeta } from '$lib/server/cloud/service';
import { readJsonDocument, writeJsonDocument } from '$lib/server/cloud/filetypes/json';
import type { RequestHandler } from './$types';

async function resolvePhysicalPath(orgConfig: App.Locals['orgConfig'], nodeId: string): Promise<string | null> {
  if (!orgConfig) return null;

  const meta = await getFileSystemMeta(orgConfig);

  if (!meta.nodes || !meta.nodes[nodeId]) {
    return null;
  }

  // Build the path recursively by climbing up the parent IDs
  let currentId: string | null = nodeId;
  const pathParts: string[] = [];

  while (currentId && meta.nodes[currentId]) {
    const currentNode: any = meta.nodes[currentId];
    // DYNAMIC PATH: Construct physical name using ID + Extension
    pathParts.unshift(`${currentId}${currentNode.extension}`);
    currentId = currentNode.parentId;
  }

  const fullPath = pathParts.join('/');
  return `/${orgConfig.cloud_directory}/${fullPath}`.replace(/\/+/g, '/');
}

export const GET: RequestHandler = async ({ url, locals }) => {
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'Missing file ID' }, { status: 400 });

  const orgConfig = locals.orgConfig;
  if (!orgConfig) return json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const physicalPath = await resolvePhysicalPath(orgConfig, id);
    if (!physicalPath) {
      return json({ error: 'Node not found in filesystem meta' }, { status: 404 });
    }

    const client = getCloudClient(orgConfig as CloudConfig);
    const documentData = await readJsonDocument(client, physicalPath);

    return json({ data: documentData });
  } catch (error: any) {
    return json({ error: error.message }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const orgConfig = locals.orgConfig;
  if (!orgConfig) return json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { id, content } = body;

    if (!id || content === undefined) {
      return json({ error: 'Invalid payload' }, { status: 400 });
    }

    const physicalPath = await resolvePhysicalPath(orgConfig, id);
    if (!physicalPath) {
      return json({ error: 'Node not found in filesystem meta' }, { status: 404 });
    }

    const client = getCloudClient(orgConfig as CloudConfig);
    await writeJsonDocument(client, physicalPath, content);

    return json({ success: true, id });
  } catch (error: any) {
    return json({ error: error.message }, { status: 500 });
  }
};
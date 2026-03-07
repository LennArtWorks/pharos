import { getCloudClient } from './origin/client';
import { getMetaCache, setMetaCache } from '../cache';
import { SYSTEM_CONFIG, getUIFileType, type FSRNode } from '$lib/config/filesystem';

export async function getFileSystemMeta(orgConfig: App.Locals['orgConfig']) {
  if (!orgConfig) throw new Error("No organization config provided to getFileSystemMeta");

  // 1. Check the fast RAM cache first
  const cachedMeta = getMetaCache(orgConfig.organisation_id);
  if (cachedMeta) {
    console.log(`[CACHE HIT] Returning meta for ${orgConfig.subdomain}`);
    return cachedMeta;
  }

  // Updated log message to reflect modularity!
  console.log(`[CACHE MISS] Fetching meta from Cloud for ${orgConfig.subdomain}...`);

  // 2. Fallback to Cloud Storage (WebDAV via client.ts)
  const client = getCloudClient(orgConfig);
  const metaPath = `/${orgConfig.cloud_directory}/${SYSTEM_CONFIG.CONFIG_FOLDER}/${SYSTEM_CONFIG.META_FILENAME}${SYSTEM_CONFIG.EXTENSIONS.SYSTEM_FILE}`;

  try {
    const content = await client.getFileContents(metaPath, { format: "text" });
    const parsedData = JSON.parse(content as string);

    // 3. Save the fresh data to RAM for the next 15 minutes
    setMetaCache(orgConfig.organisation_id, parsedData);

    return parsedData;
  } catch (e) {
    console.warn(`Meta file not found at ${metaPath}, returning empty state`);
    return { nodes: {} };
  }
}

export function transformNodesToTree(nodes: Record<string, any>): FSRNode[] {
  const nodeArray: FSRNode[] = Object.entries(nodes).map(([id, node]) => {
    // Detect workspace using SYSTEM_CONFIG.EXTENSIONS.WORKSPACE
    const isWorkspace = node.type === 'workspace' ||
      (node.type === 'folder' && node.physicalName?.endsWith(SYSTEM_CONFIG.EXTENSIONS.WORKSPACE));

    return {
      ...node,
      id,
      type: isWorkspace ? 'workspace' : node.type,
      uiFileType: node.type === 'folder' ? 'folder' : getUIFileType(node.extension),
      children: []
    } as FSRNode;
  });

  const map = new Map(nodeArray.map((node) => [node.id, node]));
  const root: FSRNode[] = [];

  nodeArray.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) {
      const parent = map.get(node.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(node);
      }
    } else {
      root.push(node);
    }
  });

  return root;
}
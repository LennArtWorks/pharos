import { getCloudClient, type CloudConfig } from './origin/client';
import { getMetaCache, setMetaCache } from '../cache';
import { SYSTEM_CONFIG, getUIFileType, getFileConfig, type FSRNode, FILE_TYPE_CONFIG } from '$lib/config/filesystem';

export async function getFileSystemMeta(orgConfig: App.Locals['orgConfig']) {
  if (!orgConfig) throw new Error("No organization config provided to getFileSystemMeta");

  // 1. Check RAM Cache (Single Source of Truth)
  const cachedMeta = getMetaCache(orgConfig.organisation_id);
  if (cachedMeta) {
    return cachedMeta;
  }

  // 2. Fetch raw "Lean" JSON from Sciebo
  const client = getCloudClient(orgConfig as CloudConfig);
  const metaPath = `/${SYSTEM_CONFIG.CONFIG_FOLDER}/${SYSTEM_CONFIG.META_FILE.join('')}`;

  try {
    const content = await client.getFileContents(metaPath, { format: "text" });
    const parsedData = JSON.parse(content as string);

    setMetaCache(orgConfig.organisation_id, parsedData);
    return parsedData;
  } catch (e) {
    console.warn(`Meta file not found at ${metaPath}, returning empty state`);
    return { nodes: {} };
  }
}

export function transformNodesToTree(nodes: Record<string, any>): FSRNode[] {
  const nodeArray: FSRNode[] = Object.entries(nodes).map(([id, node]) => {
    // Get the behavioral definition from filesystem.ts
    const config = getFileConfig(node.extension);

    return {
      ...node,
      id,
      // DYNAMIC HYDRATION: Map physical extension to UI behaviors
      type: config.type,
      uiFileType: getUIFileType(node.extension),
      physicalName: `${id}${node.extension}`,
      children: []
    } as FSRNode;
  });

  // Build the recursive tree structure
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
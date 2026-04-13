import { getCloudClient, type CloudConfig } from './origin/client';
import { getMetaCache, setMetaCache } from '../cache';
import { SYSTEM_CONFIG, type VNode, FILE_TYPE_CONFIG } from '$lib/config/filesystem';
import { buildNodeFilename, getFileConfig, getUIFileType } from '$lib/utils/config/filesystem';

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

export function transformNodesToTree(nodes: Record<string, any>): VNode[] {
  const nodeArray: VNode[] = Object.entries(nodes).map(([id, node]) => {
    const config = getFileConfig(node.extension);

    return {
      ...node,
      id,
      type: config.type,
      uiFileType: getUIFileType(node.extension),
      physicalName: buildNodeFilename(id, node.extension, {
        isSecure: node.isSecure,
        isTemplate: node.isTemplate
      }),
      children: []
    } as VNode;
  });

  // Build the recursive tree structure
  const map = new Map(nodeArray.map((node) => [node.id, node]));
  const root: VNode[] = [];

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

export async function resolvePhysicalPath(orgConfig: App.Locals['orgConfig'], nodeId: string): Promise<string | null> {
  if (!orgConfig) return null;

  const meta = await getFileSystemMeta(orgConfig);
  if (!meta.nodes || !meta.nodes[nodeId]) return null;

  let currentId: string | null = nodeId;
  const pathParts: string[] = [];

  while (currentId && meta.nodes[currentId]) {
    const currentNode: any = meta.nodes[currentId];

    const physicalName = buildNodeFilename(currentId, currentNode.extension, {
      isSecure: currentNode.isSecure,
      isTemplate: currentNode.isTemplate
    });

    pathParts.unshift(physicalName);
    currentId = currentNode.parentId;
  }

  const fullPath = pathParts.join('/');
  return `/${fullPath}`.replace(/\/+/g, '/');
}
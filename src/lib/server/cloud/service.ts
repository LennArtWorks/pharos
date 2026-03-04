import { getScieboClient } from './sciebo';
import { SYSTEM_CONFIG, getUIFileType, type FSRNode } from '$lib/config/filesystem';

export async function getFileSystemMeta(org: any) {
  const client = getScieboClient({
    url: org.cloud_url,
    user: org.cloud_username,
    pass: org.decrypted_password
  });

  // FIXED: Construction now matches sync.ts using .config and the .fsrsys extension
  const metaPath = `/${org.cloud_directory}/${SYSTEM_CONFIG.CONFIG_FOLDER}/${SYSTEM_CONFIG.META_FILENAME}${SYSTEM_CONFIG.EXTENSIONS.SYSTEM_FILE}`;

  try {
    const content = await client.getFileContents(metaPath, { format: "text" });
    return JSON.parse(content as string);
  } catch (e) {
    console.warn(`meta file not found at ${metaPath}, returning empty state`);
    return { nodes: {} };
  }
}

export function transformNodesToTree(nodes: Record<string, any>): FSRNode[] {
  const nodeArray: FSRNode[] = Object.entries(nodes).map(([id, node]) => {
    // FIXED: Detect workspace using SYSTEM_CONFIG.EXTENSIONS.WORKSPACE
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
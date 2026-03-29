import { getCloudClient, type CloudConfig } from './origin/client';
import { setMetaCache } from '../cache';
import { FILE_TYPE_CONFIG, SYSTEM_CONFIG, type FSRMeta } from '$lib/config/filesystem';
import { createHash } from 'crypto';
import { parseNodeFilename } from '$lib/utils/config/filesystem';
import { generateDefaultMetaIndex, generateBaseNode } from '$lib/config/cloudfiles/meta';

function generateNodeId(path: string): string {
  const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
  const hash = createHash('md5').update(cleanPath).digest('hex').substring(0, 12);
  return `${SYSTEM_CONFIG.ID_PREFIX}_${hash}`;
}

function getParentPath(path: string): string {
  const parts = path.split('/').filter(Boolean);
  if (parts.length <= 1) return '/';
  return '/' + parts.slice(0, -1).join('/');
}

export async function syncCloudIndex(orgConfig: App.Locals['orgConfig']) {
  if (!orgConfig) throw new Error("No organization config provided");

  const client = getCloudClient(orgConfig as CloudConfig);
  const rootPath = '/';
  const configPath = `/${SYSTEM_CONFIG.CONFIG_FOLDER}`;

  try { await client.createDirectory(configPath); } catch (e) { }

  const metaPath = `${configPath}/${SYSTEM_CONFIG.META_FILE.join('')}`;

  // 1. Use the new Blueprint Factory!
  let existingMeta: FSRMeta = generateDefaultMetaIndex();

  try {
    const raw = await client.getFileContents(metaPath, { format: "text" });
    existingMeta = JSON.parse(raw as string);
  } catch (e) { console.log("Fresh setup."); }

  const temporaryNameMap: Record<string, string> = {};
  Object.entries(existingMeta.nodes).forEach(([id, node]: [string, any]) => {
    temporaryNameMap[id] = node.name;
  });

  const allPhysicalFiles: any[] = await client.getDirectoryContents(rootPath, { deep: true });
  const newNodes: Record<string, any> = {};

  allPhysicalFiles.forEach((file: any) => {
    if (file.filename.includes(`/${SYSTEM_CONFIG.CONFIG_FOLDER}`)) return;
    if (file.filename === rootPath) return;

    const isHidden = SYSTEM_CONFIG.HIDDEN_PREFIXES.some(prefix => file.basename.startsWith(prefix));
    if (isHidden) return;

    const isDir = file.type === 'directory';
    const parsed = parseNodeFilename(file.basename);
    const parentPath = getParentPath(file.filename);

    let parentId = null;
    if (parentPath !== rootPath) {
      const parentBasename = parentPath.split('/').pop() || '';
      const parsedParent = parseNodeFilename(parentBasename);
      parentId = parsedParent.logicalName.split('.')[0]
        .replace(FILE_TYPE_CONFIG.internal.workspace.ext[0], '')
        .replace(FILE_TYPE_CONFIG.internal.sysfolder.ext[0], '');
    }

    const id = parsed.logicalName.split('.')[0]
      .replace(FILE_TYPE_CONFIG.internal.workspace.ext[0], '')
      .replace(FILE_TYPE_CONFIG.internal.sysfolder.ext[0], '');

    let extension = isDir ? '' : parsed.baseExtension;
    if (isDir) {
      if (parsed.logicalName.endsWith(FILE_TYPE_CONFIG.internal.workspace.ext[0])) extension = FILE_TYPE_CONFIG.internal.workspace.ext[0];
      else if (parsed.logicalName.endsWith(FILE_TYPE_CONFIG.internal.sysfolder.ext[0])) extension = FILE_TYPE_CONFIG.internal.sysfolder.ext[0];
    }

    const existingNode = existingMeta.nodes[id] as any;
    const nodeName = temporaryNameMap[id] || (isDir ? 'New Folder' : 'New File');
    const isTemplate = parsed.isTemplate || existingNode?.isTemplate || false;

    // 2. Use the new Node Blueprint Factory!
    const newNode = generateBaseNode(nodeName, parentId, extension, parsed.isSecure, isTemplate);

    // Preserve old timestamps and custom fields
    newNode.createdAt = existingNode?.createdAt || newNode.createdAt;
    newNode.updatedAt = new Date(file.lastmod).getTime();
    newNode.tags = existingNode?.tags || [];
    newNode.customFields = existingNode?.customFields || {};

    newNodes[id] = newNode;
  });

  existingMeta.nodes = newNodes;
  existingMeta._meta.lastUpdated = Date.now();

  await client.putFileContents(metaPath, JSON.stringify(existingMeta, null, 2));
  setMetaCache(orgConfig.organisation_id, existingMeta);

  return existingMeta;
}
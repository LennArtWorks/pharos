import { getCloudClient, type CloudConfig } from './origin/client';
import { setMetaCache } from '../cache';
import { FILE_TYPE_CONFIG, SYSTEM_CONFIG, type FSRMeta } from '$lib/config/filesystem';
import { createHash } from 'crypto';
import { DEFAULT_ROLES } from '$lib/config/permissions';
import { parseNodeFilename, buildNodeFilename } from '$lib/utils/filesystem';
import db from '$lib/server/db';

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
  if (!orgConfig) throw new Error("No organization config provided to syncCloudIndex");

  // 1. Use the modular client!
  const client = getCloudClient(orgConfig as CloudConfig);

  const rootPath = '/';
  const configPath = `/${SYSTEM_CONFIG.CONFIG_FOLDER}`;

  try {
    await client.createDirectory(configPath);
  } catch (e: any) {
    console.log("Config dir creation skipped or failed:", e.message);
  }

  /* ---------------------------------------------------------------- *
   * Create Default Roles if no roles.fsrsys is found
   * ---------------------------------------------------------------- */

  const rolesPath = `${configPath}/${SYSTEM_CONFIG.ROLES_FILE.join('')}`;

  let activeRoles: Record<string, string[]> = {};

  try {
    const rawRoles = await client.getFileContents(rolesPath, { format: "text" });
    activeRoles = JSON.parse(rawRoles as string);
  } catch (e) {
    console.log("No roles file found. Creating default roles.fsrsys.");
    activeRoles = DEFAULT_ROLES;
    await client.putFileContents(rolesPath, JSON.stringify(activeRoles, null, 2));
  }

  // Save the cached roles to SQLite so hooks.server.ts can read them instantly
  try {
    db.prepare(`UPDATE organisations SET roles_json = ? WHERE organisation_id = ?`)
      .run(JSON.stringify(activeRoles), orgConfig.organisation_id);
  } catch (err) {
    console.error("Failed to update roles in local database", err);
  }

  /* ---------------------------------------------------------------- *
   * update/build meta.fsrsys and setup filetree
   * ---------------------------------------------------------------- */

  const metaPath = `${configPath}/${SYSTEM_CONFIG.META_FILE.join('')}`;

  // 1. Load Existing Meta
  let existingMeta: FSRMeta = {
    _meta: { schemaVersion: "1.4", lastUpdated: Date.now(), description: "Global index" },
    nodes: {}
  };

  try {
    const raw = await client.getFileContents(metaPath, { format: "text" });
    existingMeta = JSON.parse(raw as string);
  } catch (e) { console.log("Fresh setup."); }

  // 2. Initial Setup: Create Default Workspace if none in root (RESTORED!)
  const rootItems = await client.getDirectoryContents(rootPath);
  const hasWorkspace = rootItems.some(f => f.basename.endsWith(FILE_TYPE_CONFIG.internal.workspace.ext[0]));

  if (!hasWorkspace) {
    const defaultWSName = `${SYSTEM_CONFIG.DEFAULT_WORKSPACE}${FILE_TYPE_CONFIG.internal.workspace.ext[0]}`;
    const defaultWSPath = `${rootPath}/${defaultWSName}`;
    await client.createDirectory(defaultWSPath);

    for (const item of rootItems) {
      // Don't move the .config folder
      if (item.basename === SYSTEM_CONFIG.CONFIG_FOLDER) continue;
      // Move stray files/folders into the new workspace
      if (item.basename !== defaultWSName) {
        await client.moveFile(item.filename, `${defaultWSPath}/${item.basename}`);
      }
    }
  }

  // 3. Scan & Name Preservation (Preserve names BEFORE renaming)
  const initialScan: any[] = await client.getDirectoryContents(rootPath, { deep: true });
  const temporaryNameMap: Record<string, string> = {};

  initialScan.forEach(file => {
    const id = generateNodeId(file.filename);
    const existingNode = existingMeta.nodes[id] as any;

    if (existingNode) {
      temporaryNameMap[id] = existingNode.name;
    } else {
      // Logic for new files: Clean basename
      temporaryNameMap[id] = file.basename
        .split('.')[0]
        .replace(FILE_TYPE_CONFIG.internal.workspace.ext[0], '')
        .replace(FILE_TYPE_CONFIG.internal.sysfolder.ext[0], '');
    }
  });

  // 4. Physical Rename Pass (Bottom-Up)
  const sortedFiles = [...initialScan].sort((a, b) => b.filename.length - a.filename.length);

  for (const file of sortedFiles) {
    if (file.filename.includes(`/${SYSTEM_CONFIG.CONFIG_FOLDER}`)) continue;
    if (file.filename === rootPath) continue;

    const parsed = parseNodeFilename(file.basename);
    const id = generateNodeId(file.filename);
    const isDir = file.type === 'directory';

    let expectedBaseExt = isDir ? '' : parsed.baseExtension;
    if (isDir) {
      if (parsed.logicalName.endsWith(FILE_TYPE_CONFIG.internal.workspace.ext[0])) expectedBaseExt = FILE_TYPE_CONFIG.internal.workspace.ext[0];
      else if (parsed.logicalName.endsWith(FILE_TYPE_CONFIG.internal.sysfolder.ext[0])) expectedBaseExt = FILE_TYPE_CONFIG.internal.sysfolder.ext[0];
    }

    const expectedBasename = buildNodeFilename(id, expectedBaseExt, {
      isSecure: parsed.isSecure,
      isTemplate: parsed.isTemplate
    });

    if (file.basename !== expectedBasename) {
      const newPath = `${getParentPath(file.filename)}/${expectedBasename}`;
      try {
        await client.moveFile(file.filename, newPath);
      } catch (err) { console.error(`Rename failed: ${file.basename}`); }
    }
  }

  // 5. Build Final Node Map (UPDATED FOR LEAN JSON STANDARD)
  const finalizedFiles = await client.getDirectoryContents(rootPath, { deep: true });
  const newNodes: Record<string, any> = {};

  finalizedFiles.forEach((file: any) => {
    if (file.filename.includes(`/${SYSTEM_CONFIG.CONFIG_FOLDER}`)) return;
    if (file.filename === rootPath) return;

    const isDir = file.type === 'directory';

    // Extract ID safely
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

    // Determine the exact physical extension (Crucial for the new server.js path builder)
    const id = parsed.logicalName.split('.')[0]
      .replace(FILE_TYPE_CONFIG.internal.workspace.ext[0], '')
      .replace(FILE_TYPE_CONFIG.internal.sysfolder.ext[0], '');

    let extension = isDir ? '' : parsed.baseExtension;
    if (isDir) {
      if (parsed.logicalName.endsWith(FILE_TYPE_CONFIG.internal.workspace.ext[0])) extension = FILE_TYPE_CONFIG.internal.workspace.ext[0];
      else if (parsed.logicalName.endsWith(FILE_TYPE_CONFIG.internal.sysfolder.ext[0])) extension = FILE_TYPE_CONFIG.internal.sysfolder.ext[0];
    }

    const existingNode = existingMeta.nodes[id] as any;

    // LEAN JSON: We strip type, physicalName, and uiFileType.
    newNodes[id] = {
      name: temporaryNameMap[id] || (isDir ? 'New Folder' : 'New File'),
      parentId: parentId,
      extension: extension,
      isSecure: parsed.isSecure,
      isTemplate: parsed.isTemplate || existingNode?.isTemplate || existingNode?.customFields?.isTemplate || false,
      updatedAt: new Date(file.lastmod).getTime(),
      createdAt: existingNode?.createdAt || Date.now(),
      tags: existingNode?.tags || [],
      customFields: existingNode?.customFields || {}
    };
  });

  existingMeta.nodes = newNodes;
  existingMeta._meta.lastUpdated = Date.now();

  // Save to Cloud
  await client.putFileContents(metaPath, JSON.stringify(existingMeta, null, 2));

  // Instant Cache Update!
  setMetaCache(orgConfig.organisation_id, existingMeta);

  return existingMeta;
}
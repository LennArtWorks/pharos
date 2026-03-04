import { getScieboClient } from './sciebo';
import { SYSTEM_CONFIG, getUIFileType, type FSRMeta } from '$lib/config/filesystem';
import { createHash } from 'crypto';
import { DEFAULT_ROLES } from '$lib/config/permissions';
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

export async function syncCloudIndex(org: any) {
  const client = getScieboClient({
    url: org.cloud_url,
    user: org.cloud_username,
    pass: org.decrypted_password
  });

  let rootPath = org.cloud_directory.startsWith('/') ? org.cloud_directory : `/${org.cloud_directory}`;
  if (rootPath.endsWith('/')) rootPath = rootPath.slice(0, -1);

  const configPath = `${rootPath}/${SYSTEM_CONFIG.CONFIG_FOLDER}`;
  try { await client.createDirectory(configPath); } catch (e) { }

  /* ---------------------------------------------------------------- *
   *  Create Default Roles if no roles.fsrsys is found
   * ---------------------------------------------------------------- */

  const rolesPath = `${configPath}/roles${SYSTEM_CONFIG.EXTENSIONS.SYSTEM_FILE}`;

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
      .run(JSON.stringify(activeRoles), org.organisation_id);
  } catch (err) {
    console.error("Failed to update roles in local database", err);
  }

  /* ---------------------------------------------------------------- *
   *  update/build meta.fsrsys and setup filetree
   * ---------------------------------------------------------------- */

  const metaPath = `${configPath}/${SYSTEM_CONFIG.META_FILENAME}${SYSTEM_CONFIG.EXTENSIONS.SYSTEM_FILE}`;

  // 1. Load Existing Meta
  let existingMeta: FSRMeta = {
    _meta: { schemaVersion: "1.3", lastUpdated: Date.now(), description: "Global index" },
    nodes: {}
  };

  try {
    const raw = await client.getFileContents(metaPath, { format: "text" });
    existingMeta = JSON.parse(raw as string);
  } catch (e) { console.log("Fresh setup."); }

  // 2. Initial Setup: Create Default Workspace if none in root
  const rootItems = await client.getDirectoryContents(rootPath);
  const hasWorkspace = rootItems.some(f => f.basename.endsWith(SYSTEM_CONFIG.EXTENSIONS.WORKSPACE));

  if (!hasWorkspace) {
    const defaultWSName = `${SYSTEM_CONFIG.DEFAULT_WORKSPACE}${SYSTEM_CONFIG.EXTENSIONS.WORKSPACE}`;
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
    const existingNode = existingMeta.nodes[id];

    if (existingNode) {
      temporaryNameMap[id] = existingNode.name;
    } else {
      // Logic for new files: Clean basename
      temporaryNameMap[id] = file.basename
        .split('.')[0]
        .replace(SYSTEM_CONFIG.EXTENSIONS.WORKSPACE, '')
        .replace(SYSTEM_CONFIG.EXTENSIONS.SYSTEM_FOLDER, '');
    }
  });

  // 4. Physical Rename Pass (Bottom-Up)
  const sortedFiles = [...initialScan].sort((a, b) => b.filename.length - a.filename.length);

  for (const file of sortedFiles) {
    if (file.filename.includes(`/${SYSTEM_CONFIG.CONFIG_FOLDER}`)) continue;
    if (file.filename === rootPath) continue;

    const id = generateNodeId(file.filename);
    const isDir = file.type === 'directory';
    const ext = isDir ? '' : `.${file.basename.split('.').pop()}`;

    let suffix = '';
    if (isDir) {
      if (file.basename.endsWith(SYSTEM_CONFIG.EXTENSIONS.WORKSPACE)) suffix = SYSTEM_CONFIG.EXTENSIONS.WORKSPACE;
      else if (file.basename.endsWith(SYSTEM_CONFIG.EXTENSIONS.SYSTEM_FOLDER)) suffix = SYSTEM_CONFIG.EXTENSIONS.SYSTEM_FOLDER;
    }

    const expectedBasename = `${id}${suffix}${ext}`;

    if (file.basename !== expectedBasename) {
      const newPath = `${getParentPath(file.filename)}/${expectedBasename}`;
      try {
        await client.moveFile(file.filename, newPath);
      } catch (err) { console.error(`Rename failed: ${file.basename}`); }
    }
  }

  // 5. Build Final Node Map
  const finalizedFiles = await client.getDirectoryContents(rootPath, { deep: true });
  const newNodes: Record<string, any> = {};

  finalizedFiles.forEach((file: any) => {
    if (file.filename.includes(`/${SYSTEM_CONFIG.CONFIG_FOLDER}`)) return;
    if (file.filename === rootPath) return;

    const isDir = file.type === 'directory';
    // Extract ID safely
    const id = file.basename.split('.')[0]
      .replace(SYSTEM_CONFIG.EXTENSIONS.WORKSPACE, '')
      .replace(SYSTEM_CONFIG.EXTENSIONS.SYSTEM_FOLDER, '');

    const parentPath = getParentPath(file.filename);
    let parentId = null;
    if (parentPath !== rootPath) {
      const parentBasename = parentPath.split('/').pop() || '';
      parentId = parentBasename.split('.')[0]
        .replace(SYSTEM_CONFIG.EXTENSIONS.WORKSPACE, '')
        .replace(SYSTEM_CONFIG.EXTENSIONS.SYSTEM_FOLDER, '');
    }

    const extension = isDir ? '' : `.${file.basename.split('.').pop()}`;
    const existingNode = existingMeta.nodes[id];

    newNodes[id] = {
      type: isDir && file.basename.includes(SYSTEM_CONFIG.EXTENSIONS.WORKSPACE) ? 'workspace' : (isDir ? 'folder' : 'file'),
      name: temporaryNameMap[id] || (isDir ? 'New Folder' : 'New File'),
      physicalName: file.basename,
      parentId: parentId,
      extension: extension,
      updatedAt: new Date(file.lastmod).getTime(),
      createdAt: existingNode?.createdAt || Date.now(),
      uiFileType: isDir ? 'folder' : getUIFileType(extension),
      tags: existingNode?.tags || [],
      isTemplate: existingNode?.isTemplate || false,
      customFields: existingNode?.customFields || {}
    };
  });

  existingMeta.nodes = newNodes;
  existingMeta._meta.lastUpdated = Date.now();

  await client.putFileContents(metaPath, JSON.stringify(existingMeta, null, 2));
  return existingMeta;
}
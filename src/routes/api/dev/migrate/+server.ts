import { json } from '@sveltejs/kit';
import { getCloudClient, type CloudConfig } from '$lib/server/cloud/origin/client';
import { SYSTEM_CONFIG, type AppMeta } from '$lib/config/filesystem';
import { APP_EXTENSIONS } from '$lib/config/globalsettings';
import { clearMetaCache } from '$lib/server/cache';
import { logOperatorAction } from '$lib/server/audit';

// ---------------------------------------------------------------------------
// Extension map: old legacy (fsr-prefix) extensions → current APP_EXTENSIONS
// Add entries here if additional legacy prefixes need to be handled in future.
// ---------------------------------------------------------------------------
const LEGACY_EXT_MAP: Record<string, string> = {
  '.fsrsys':    APP_EXTENSIONS.SYS,
  '.fsrdoc':    APP_EXTENSIONS.DOC,
  '.fsrtasks':  APP_EXTENSIONS.TASKS,
  '.fsrevt':    APP_EXTENSIONS.EVENT,
};
const LEGACY_SECURE_MODIFIER = '.fsrsecure';
const LEGACY_ID_PREFIX       = 'fsr_';

// Transform a WebDAV basename to its migrated form.
// Handles: ID prefix stripping + extension renaming + secure-modifier renaming.
// Returns the same string if no changes are needed (idempotent).
function transformBasename(basename: string): string {
  let name = basename;

  // 1. Strip secure modifier (handle at suffix level)
  const hasLegacySecure = name.endsWith(LEGACY_SECURE_MODIFIER);
  if (hasLegacySecure) name = name.slice(0, -LEGACY_SECURE_MODIFIER.length);

  const hasNewSecure = name.endsWith(APP_EXTENSIONS.SECURE_MODIFIER);
  if (hasNewSecure) name = name.slice(0, -APP_EXTENSIONS.SECURE_MODIFIER.length);

  // 2. Replace legacy extension
  for (const [oldExt, newExt] of Object.entries(LEGACY_EXT_MAP)) {
    if (name.endsWith(oldExt)) {
      name = name.slice(0, -oldExt.length) + newExt;
      break;
    }
  }

  // 3. Strip legacy ID prefix from the part before the first dot
  const dotIdx = name.indexOf('.');
  const idPart  = dotIdx >= 0 ? name.slice(0, dotIdx) : name;
  const extPart = dotIdx >= 0 ? name.slice(dotIdx)    : '';
  const newId   = idPart.startsWith(LEGACY_ID_PREFIX) ? idPart.slice(LEGACY_ID_PREFIX.length) : idPart;
  name = newId + extPart;

  // 4. Re-attach secure modifier (use new name)
  if (hasLegacySecure || hasNewSecure) name += APP_EXTENSIONS.SECURE_MODIFIER;

  return name;
}

export async function POST({ locals }) {
  if (!locals.operator || (locals.operator.tier !== 'owner' && locals.operator.tier !== 'support')) {
    return json({ error: 'Unauthorized' }, { status: 403 });
  }
  if (!locals.orgConfig) return json({ error: 'No organization context' }, { status: 400 });

  const orgConfig = locals.orgConfig;
  const client = getCloudClient(orgConfig as CloudConfig);
  const results = { total: 0, migrated: 0, skipped: 0, errors: [] as string[] };

  // -------------------------------------------------------------------------
  // 1. Load meta — try current path first, then the legacy .fsrsys path
  // -------------------------------------------------------------------------
  const currentMetaPath = `/${SYSTEM_CONFIG.CONFIG_FOLDER}/${SYSTEM_CONFIG.META_FILE.join('')}`;
  const legacyMetaPath  = `/.config/meta.fsrsys`;

  let meta: AppMeta | null = null;
  let sourceMetaPath = currentMetaPath;

  for (const tryPath of [currentMetaPath, legacyMetaPath]) {
    try {
      const raw = await client.getFileContents(tryPath, { format: 'text' });
      meta = JSON.parse(raw as string) as AppMeta;
      sourceMetaPath = tryPath;
      break;
    } catch { /* try next */ }
  }

  if (!meta) return json({ error: 'Could not load meta index from cloud storage' }, { status: 500 });

  // -------------------------------------------------------------------------
  // 2. Rename physical files & directories on WebDAV
  //    Process shallowest items first so that when a directory is renamed,
  //    the WebDAV server automatically updates all child paths.
  // -------------------------------------------------------------------------
  let allItems: any[];
  try {
    allItems = (await client.getDirectoryContents('/', { deep: true })) as any[];
  } catch (e: any) {
    return json({ error: `Failed to list cloud files: ${e.message}` }, { status: 500 });
  }

  // Exclude root, config dir, and already-hidden paths
  const items = allItems
    .filter(item => item.filename !== '/' && !item.filename.startsWith(`/.config`))
    .sort((a, b) => {
      const dA = a.filename.split('/').filter(Boolean).length;
      const dB = b.filename.split('/').filter(Boolean).length;
      return dA - dB; // shallowest first → parent renames propagate to children automatically
    });

  results.total = items.length;

  // Track renames so that already-renamed ancestor paths can be resolved
  const pathRemap: Record<string, string> = {};

  function resolveCurrentPath(originalPath: string): string {
    for (const [old, next] of Object.entries(pathRemap)) {
      if (originalPath === old || originalPath.startsWith(old + '/')) {
        return next + originalPath.slice(old.length);
      }
    }
    return originalPath;
  }

  for (const item of items) {
    const originalPath = item.filename as string;
    const currentPath  = resolveCurrentPath(originalPath);

    const lastSlash   = currentPath.lastIndexOf('/');
    const parentDir   = currentPath.slice(0, lastSlash) || '/';
    const oldBasename = currentPath.slice(lastSlash + 1);
    const newBasename = transformBasename(oldBasename);

    if (newBasename === oldBasename) {
      results.skipped++;
      continue;
    }

    const newPath = `${parentDir}/${newBasename}`.replace(/\/+/g, '/');

    try {
      await (client as any).moveFile(currentPath, newPath);
      pathRemap[originalPath] = newPath;
      results.migrated++;
    } catch (e: any) {
      results.errors.push(`${currentPath} → ${newPath}: ${e.message}`);
    }
  }

  // -------------------------------------------------------------------------
  // 3. Update meta.nodes — new IDs, new extensions, updated parentId refs
  // -------------------------------------------------------------------------
  const idMap: Record<string, string> = {};
  for (const oldId of Object.keys(meta.nodes)) {
    idMap[oldId] = oldId.startsWith(LEGACY_ID_PREFIX) ? oldId.slice(LEGACY_ID_PREFIX.length) : oldId;
  }

  const newNodes: Record<string, typeof meta.nodes[string]> = {};
  for (const [oldId, node] of Object.entries(meta.nodes)) {
    const newId       = idMap[oldId];
    const oldExt      = (node as any).extension ?? '';
    const newExt      = LEGACY_EXT_MAP[oldExt] ?? oldExt;
    const newParentId = (node as any).parentId
      ? (idMap[(node as any).parentId] ?? (node as any).parentId)
      : null;

    newNodes[newId] = { ...(node as any), extension: newExt, parentId: newParentId };
  }

  meta.nodes = newNodes as AppMeta['nodes'];
  meta._meta.lastUpdated = Date.now();

  // -------------------------------------------------------------------------
  // 4. Write updated meta to current path; delete legacy path if it changed
  // -------------------------------------------------------------------------
  try {
    await client.putFileContents(currentMetaPath, JSON.stringify(meta, null, 2));
    if (sourceMetaPath !== currentMetaPath) {
      try { await (client as any).deleteFile(sourceMetaPath); } catch { /* ignore */ }
    }
  } catch (e: any) {
    results.errors.push(`Failed to write updated meta: ${e.message}`);
  }

  // Flush RAM cache so the app picks up the new meta immediately
  clearMetaCache(orgConfig.organisation_id);

  logOperatorAction(
    locals.operator.email,
    'SYSTEM_MIGRATION',
    orgConfig.organisation_id,
    { migrated: results.migrated, skipped: results.skipped, errors: results.errors.length }
  );

  return json(results);
}

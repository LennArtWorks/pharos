import { json } from '@sveltejs/kit';
import { getFileSystemMeta, transformNodesToTree } from '$lib/server/cloud/service';
import { PERMISSIONS } from '$lib/config/permissions';
import { hasPermission } from '$lib/utils/config/permissions';

export async function GET({ locals, url }) {
  if (!locals.orgConfig) {
    return json({ error: 'Unauthorized: Organisation not found' }, { status: 401 });
  }

  // We don't need to manually check for null user anymore, because hooks.server.ts
  // guarantees locals.user is an anonymous user object if they aren't logged in!
  const userRole = locals.user!.role;
  const userOverrides = locals.user!.overrides || [];
  const activeRoles = locals.orgConfig.roles || {};

  if (!hasPermission(userRole, PERMISSIONS.FILES.READ, activeRoles, userOverrides)) {
    return json({ error: 'Forbidden: You do not have permission to view files.' }, { status: 403 });
  }

  try {
    const meta = await getFileSystemMeta(locals.orgConfig);
    const tree = transformNodesToTree(meta.nodes);
    return json(tree);
  } catch (e: any) {
    return json({ error: `Failed to load file system: ${e.message}` }, { status: 500 });
  }
}
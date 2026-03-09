import { json } from '@sveltejs/kit';
import { getFileSystemMeta, transformNodesToTree } from '$lib/server/cloud/service';
import { PERMISSIONS, hasPermission, SETUP_ROLES } from '$lib/config/permissions';

export async function GET({ locals, url }) {
  // 1. Check Tenant Config
  if (!locals.orgConfig) {
    console.error(`[API 401] OrgConfig is missing for host: ${url.hostname}`);
    return json({ error: 'Unauthorized: Tenant not found' }, { status: 401 });
  }

  // 2. SECURITY CHECK: Does this user have permission to view files?
  // If locals.user is null (no session cookie), they get the Anonymous role
  const userRole = locals.user?.role || SETUP_ROLES.GUEST;
  const activeRoles = locals.orgConfig.roles || {};

  if (!hasPermission(userRole, PERMISSIONS.FILES.READ, activeRoles)) {
    console.error(`[API 403] Access Denied. Role '${userRole}' lacks FILES.READ`);
    return json({ error: 'Forbidden: You do not have permission to view files.' }, { status: 403 });
  }

  // 3. Fetch and Hydrate
  try {
    const meta = await getFileSystemMeta(locals.orgConfig);
    const tree = transformNodesToTree(meta.nodes);
    return json(tree);
  } catch (e: any) {
    console.error('[API 500] File system load failed:', e);
    return json({ error: `Failed to load file system: ${e.message}` }, { status: 500 });
  }
}
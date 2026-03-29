import { json } from '@sveltejs/kit';
import { PERMISSIONS } from '$lib/config/permissions';
import { DEFAULT_ROLES, SETUP_ROLES } from '$lib/config/cloudfiles/roles';
import { hasPermission } from '$lib/utils/config/permissions';
import { getCloudClient, type CloudConfig } from '$lib/server/cloud/origin/client';
import { SYSTEM_CONFIG } from '$lib/config/filesystem';
import db from '$lib/server/db';

export async function GET({ locals }) {
  if (!locals.orgConfig || !locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(locals.user.role, PERMISSIONS.SYSTEM.MANAGE_ROLES, locals.orgConfig.roles || {}, locals.user.overrides || [])) {
    return json({ error: 'Permission denied.' }, { status: 403 });
  }

  try {
    const client = getCloudClient(locals.orgConfig as CloudConfig);
    const rolesPath = `/${SYSTEM_CONFIG.CONFIG_FOLDER}/${SYSTEM_CONFIG.ROLES_FILE.join('')}`;

    let rolesPayload = { guestRole: SETUP_ROLES.GUEST, newUserRole: SETUP_ROLES.NEW_USER, roles: DEFAULT_ROLES };

    try {
      const rawRoles = await client.getFileContents(rolesPath, { format: "text" });
      rolesPayload = JSON.parse(rawRoles as string);
    } catch (e) {
      // Keep pure defaults if missing
    }

    return json(rolesPayload);
  } catch (error) {
    return json({ error: 'Failed to load roles' }, { status: 500 });
  }
}

export async function POST({ request, locals }) {
  if (!locals.orgConfig || !locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(locals.user.role, PERMISSIONS.SYSTEM.MANAGE_ROLES, locals.orgConfig.roles || {}, locals.user.overrides || [])) {
    return json({ error: 'Permission denied.' }, { status: 403 });
  }

  const payload = await request.json();
  if (!payload.roles || !payload.guestRole || !payload.newUserRole) {
    return json({ error: 'Invalid payload structure' }, { status: 400 });
  }

  try {
    const client = getCloudClient(locals.orgConfig as CloudConfig);
    const rolesPath = `/${SYSTEM_CONFIG.CONFIG_FOLDER}/${SYSTEM_CONFIG.ROLES_FILE.join('')}`;
    await client.putFileContents(rolesPath, JSON.stringify(payload, null, 2));

    db.prepare(`UPDATE organisations SET roles_json = ? WHERE organisation_id = ?`)
      .run(JSON.stringify(payload), locals.orgConfig.organisation_id);

    return json({ success: true });
  } catch (error) {
    return json({ error: 'Failed to save roles' }, { status: 500 });
  }
}
import { json } from '@sveltejs/kit';
import { PERMISSIONS } from '$lib/config/permissions';
import { hasPermission } from '$lib/utils/config/permissions';
import { readSecureFile, writeSecureFile } from '$lib/server/auth/secureHandler';
import { SYSTEM_CONFIG } from '$lib/config/filesystem';

export async function GET({ locals }) {
  if (!locals.orgConfig || !locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(locals.user.role, PERMISSIONS.SYSTEM.MANAGE_USERS, locals.orgConfig.roles || {}, locals.user.overrides || [])) {
    return json({ error: 'Permission denied.' }, { status: 403 });
  }

  try {
    const authPath = `/${SYSTEM_CONFIG.CONFIG_FOLDER}/${SYSTEM_CONFIG.ACCOUNTS_FILE.join('')}`;
    const authData = await readSecureFile(locals.orgConfig, authPath);
    const identities = authData?.identities || {};
    const users = [];

    for (const [email, authInfo] of Object.entries(identities)) {
      const info = authInfo as any;
      if (!info.accountId) continue;

      users.push({
        id: info.accountId,
        email: email,
        name: info.displayName || info.name || 'Unknown',
        role: info.access?.roles?.[0] || info.role || 'Guest',
        overrides: info.access?.overrides || info.overrides || []
      });
    }

    return json({ users, roles: locals.orgConfig.roles || {} });
  } catch (error: any) {
    return json({ error: 'Failed to load accounts' }, { status: 500 });
  }
}

export async function PATCH({ request, locals }) {
  if (!locals.orgConfig || !locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(locals.user.role, PERMISSIONS.SYSTEM.MANAGE_USERS, locals.orgConfig.roles || {}, locals.user.overrides || [])) {
    return json({ error: 'Permission denied.' }, { status: 403 });
  }

  const { targetAccountId, newRole, newOverrides } = await request.json();
  if (!targetAccountId) return json({ error: 'Invalid payload' }, { status: 400 });

  if (targetAccountId.startsWith('dev_')) return json({ error: 'Cannot modify dev accounts' }, { status: 400 });

  try {
    const authPath = `/${SYSTEM_CONFIG.CONFIG_FOLDER}/${SYSTEM_CONFIG.ACCOUNTS_FILE.join('')}`;
    const authData = await readSecureFile(locals.orgConfig, authPath);

    if (authData && authData.identities) {
      for (const key in authData.identities) {
        if (authData.identities[key].accountId === targetAccountId) {
          // Initialize access object if it's an old legacy account
          authData.identities[key].access = authData.identities[key].access || { roles: [], overrides: [] };

          if (newRole) authData.identities[key].access.roles = [newRole];
          if (newOverrides) authData.identities[key].access.overrides = newOverrides;
          break;
        }
      }
      await writeSecureFile(locals.orgConfig, authPath, authData);
    }

    const profilePath = `/${SYSTEM_CONFIG.CONFIG_FOLDER}/${SYSTEM_CONFIG.ACCOUNTS_FOLDER.join('')}/${targetAccountId}.fsrsys.fsrsecure`;
    const profileData = await readSecureFile(locals.orgConfig, profilePath);

    if (profileData) {
      profileData.access = profileData.access || { roles: [], overrides: [] };
      if (newRole) profileData.access.roles = [newRole];
      if (newOverrides) profileData.access.overrides = newOverrides;
      await writeSecureFile(locals.orgConfig, profilePath, profileData);
    }

    return json({ success: true });
  } catch (error: any) {
    return json({ error: 'Failed to update user' }, { status: 500 });
  }
}
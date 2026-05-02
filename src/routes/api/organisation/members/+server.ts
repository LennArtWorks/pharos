import { json } from '@sveltejs/kit';
import { readSecureFile } from '$lib/server/auth/secureHandler';
import { SYSTEM_CONFIG } from '$lib/config/filesystem';

/**
 * GET /api/organisation/members
 * Returns a minimal member list (id + name) for assignment pickers.
 * Requires only an authenticated session — no MANAGE_USERS permission.
 */
export async function GET({ locals }) {
  if (!locals.orgConfig || !locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const authPath = `/${SYSTEM_CONFIG.CONFIG_FOLDER}/${SYSTEM_CONFIG.ACCOUNTS_FILE.join('')}`;
    const authData = await readSecureFile(locals.orgConfig, authPath);
    const identities = authData?.identities || {};
    const members: { id: string; name: string }[] = [];

    for (const [, info] of Object.entries(identities)) {
      const account = info as any;
      if (!account.accountId || account.isActive === false) continue;
      members.push({
        id: account.accountId,
        name: account.displayName || account.name || 'Unknown'
      });
    }

    return json({ members });
  } catch {
    return json({ error: 'Failed to load members' }, { status: 500 });
  }
}

import db from "$lib/server/db";
import { decrypt } from '$lib/server/auth/crypto';
import { DEFAULT_ROLES } from "$lib/config/permissions";

// 1. Define the shape of your database row to satisfy TypeScript
interface OrganisationRow {
  organisation_id: string;
  subdomain: string;
  organization_name: string;
  cloud_name: string;
  cloud_url: string;
  cloud_username: string;
  cloud_password_encrypted: string;
  cloud_directory: string;
  is_active: number;
  roles_json?: string | null;
}

export async function handle({ event, resolve }) {
  const subdomain = event.url.hostname.split('.')[0];
  console.log(`[HOOK] Request: ${event.url.pathname} | Subdomain parsed: ${subdomain}`);

  // 2. Cast the result to your interface
  const org = db.prepare('SELECT * FROM organisations WHERE subdomain = ?').get(subdomain) as OrganisationRow | undefined;

  if (org) {
    let parsedRoles = DEFAULT_ROLES;
    try {
      if (org.roles_json) {
        const parsed = JSON.parse(org.roles_json);
        if (Object.keys(parsed).length > 0) {
          parsedRoles = parsed;
        }
      }
    } catch (e) { /* fallback to default */ }

    // We must attach it to locals so the API and layout can see it
    event.locals.orgConfig = {
      ...org,
      decrypted_password: decrypt(org.cloud_password_encrypted),
      roles: parsedRoles
    };

    const sessionId = event.cookies.get('fsr_session');
    let currentUser = null;

    if (sessionId) {
      // 1. Check if the session exists and is valid for THIS organisation
      const session = db.prepare(`
        SELECT account_id, expires_at 
        FROM sessions 
        WHERE id = ? AND organisation_id = ?
      `).get(sessionId, org.organisation_id) as { account_id: string, expires_at: number } | undefined;

      if (session) {
        if (session.expires_at > Date.now()) {
          // 2. Valid Session! 
          // (For right now, we grant 'Admin' so you can test. 
          // Next step is fetching their real role from RAM Cache)
          currentUser = {
            id: session.account_id,
            role: 'Admin',
            name: 'Real User'
          };
        } else {
          // 3. Expired Session - Clean it up
          db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
          event.cookies.delete('fsr_session', { path: '/' });
        }
      }
    }

    // Assign the real user (or null if they aren't logged in, triggering the Anonymous animal!)
    event.locals.user = currentUser;

  }

  return await resolve(event);
}

// Background Task: Sync every 4 hours
const FOUR_HOURS = 4 * 60 * 60 * 1000;

setInterval(async () => {
  try {
    // Cast the .all() result as well
    const activeOrgs = db.prepare('SELECT * FROM organisations WHERE is_active = 1').all() as OrganisationRow[];

    for (const org of activeOrgs) {
      try {
        const orgWithDecryptedPass = {
          ...org,
          decrypted_password: decrypt(org.cloud_password_encrypted)
        };

        // Uncomment when ready to test auto-sync
        // await syncCloudIndex(orgWithDecryptedPass);
        console.log(`Auto-synced: ${org.subdomain}`);
      } catch (e) {
        console.error(`Sync failed for ${org.subdomain}`, e);
      }
    }
  } catch (err) {
    console.error("Failed to fetch active orgs for interval sync", err);
  }
}, FOUR_HOURS);
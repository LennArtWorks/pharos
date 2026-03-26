import db from "$lib/server/db";
import { decrypt } from '$lib/server/auth/crypto';
import { DEFAULT_ROLES } from "$lib/config/permissions";
import { getCachedUser, setCachedUser } from "$lib/server/auth/userCache";
import { readSecureFile } from "$lib/server/cloud/secureHandler";
import { SYSTEM_CONFIG } from "$lib/config/filesystem";

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

    // Reconstruct full config with decrypted password
    const orgConfig = {
      ...org,
      decrypted_password: decrypt(org.cloud_password_encrypted),
      roles: parsedRoles
    };

    event.locals.orgConfig = orgConfig;

    const sessionId = event.cookies.get('fsr_session');
    let currentUser = null;

    if (sessionId) {
      const session = db.prepare(`
        SELECT account_id, expires_at 
        FROM sessions 
        WHERE id = ? AND organisation_id = ?
      `).get(sessionId, org.organisation_id) as { account_id: string, expires_at: number } | undefined;

      if (session && session.expires_at > Date.now()) {
        const accountId = session.account_id;

        // 1. Check RAM Cache
        currentUser = getCachedUser(accountId);

        // 2. Fetch from WebDAV if not in cache
        if (!currentUser) {
          try {
            const profilePath = `/${SYSTEM_CONFIG.CONFIG_FOLDER}/accounts.sysfolder/${accountId}.fsrsys.fsrsecure`;
            const profileData = await readSecureFile(orgConfig, profilePath);

            if (profileData) {
              currentUser = {
                id: accountId,
                // Drill into .profile and .access correctly!
                name: profileData.profile?.displayName || profileData.profile?.firstName || 'Unknown User',
                role: profileData.access?.roles?.[0] || 'Member',
                color: profileData.profile?.color || '#888888' // Fallback color just in case
              };
            } else {
              throw new Error("Profile file not found");
            }
          } catch (e) {
            // Fallback for missing profiles during development
            console.log(`[AUTH] Profile missing for ${accountId}, using fallback.`);
            currentUser = {
              id: accountId,
              name: 'New User',
              role: 'Admin'
            };
          }

          // Cache the result
          setCachedUser(accountId, currentUser);
        }
      } else if (session) {
        // Expired Session - Clean it up
        db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
        event.cookies.delete('fsr_session', { path: '/' });
      }
    }

    event.locals.user = currentUser;
  }

  return await resolve(event);
}

// Background Task: Sync every 4 hours
const FOUR_HOURS = 4 * 60 * 60 * 1000;

setInterval(async () => {
  try {
    const activeOrgs = db.prepare('SELECT * FROM organisations WHERE is_active = 1').all() as OrganisationRow[];

    for (const org of activeOrgs) {
      try {
        const orgWithDecryptedPass = {
          ...org,
          decrypted_password: decrypt(org.cloud_password_encrypted)
        };
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
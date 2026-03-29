import db from "$lib/server/db";
import { decrypt } from '$lib/server/auth/crypto';
import { DEFAULT_ROLES, SETUP_ROLES } from "$lib/config/cloudfiles/roles";
// import { generateAnonymousSessionUser } from "$lib/config/cloudfiles/user";
import { getCachedUser, setCachedUser } from "$lib/server/auth/userCache";
import { readSecureFile } from "$lib/server/auth/secureHandler";
import { SYSTEM_CONFIG } from "$lib/config/filesystem";
import { GLOBAL_SETTINGS } from "$lib/config/globalsettings";
import { dev } from '$app/environment';
import { SESSION_COOKIE } from '$lib/config/cookies/session';
import { generateAnonymousSessionUser } from "$lib/config/cloudfiles/user";

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
  const org = db.prepare('SELECT * FROM organisations WHERE subdomain = ?').get(subdomain) as OrganisationRow | undefined;

  if (org) {
    let parsedRoles = DEFAULT_ROLES;
    let guestRole = SETUP_ROLES.GUEST;
    let newUserRole = SETUP_ROLES.NEW_USER;

    try {
      if (org.roles_json) {
        const parsed = JSON.parse(org.roles_json);

        if (parsed.roles && Object.keys(parsed.roles).length > 0) {
          parsedRoles = parsed.roles;
          guestRole = parsed.guestRole || guestRole;
          newUserRole = parsed.newUserRole || newUserRole;
        } else if (Object.keys(parsed).length > 0 && !parsed.roles) {
          // Legacy flat structure catch
          parsedRoles = parsed;
        }
      }
    } catch (e) {
      // JSON failed, keep defaults 
    }

    // BULLETPROOF CHECK: If somehow parsedRoles is still empty, force defaults
    if (Object.keys(parsedRoles).length === 0) {
      parsedRoles = DEFAULT_ROLES;
    }

    const orgConfig = {
      ...org,
      decrypted_password: decrypt(org.cloud_password_encrypted),
      roles: parsedRoles,
      guestRole,
      newUserRole
    };

    event.locals.orgConfig = orgConfig;

    const sessionId = event.cookies.get(SESSION_COOKIE.NAME);
    let currentUser = null;

    if (sessionId) {
      const session = db.prepare(`SELECT account_id, expires_at FROM sessions WHERE id = ? AND organisation_id = ?`)
        .get(sessionId, org.organisation_id) as { account_id: string, expires_at: number } | undefined;

      if (session && session.expires_at > Date.now()) {
        currentUser = getCachedUser(session.account_id);

        if (!currentUser) {
          try {
            const profilePath = `/${SYSTEM_CONFIG.CONFIG_FOLDER}/${SYSTEM_CONFIG.ACCOUNTS_FOLDER.join('')}/${session.account_id}.fsrsys.fsrsecure`;
            const profileData = await readSecureFile(orgConfig, profilePath);

            if (profileData) {
              currentUser = {
                id: session.account_id,
                name: profileData.profile?.displayName || profileData.profile?.firstName || 'Unknown User',
                role: profileData.access?.roles?.[0] || newUserRole,
                color: profileData.profile?.color || '#888888',
                overrides: profileData.access?.overrides || [] // <--- Ensure overrides load into memory!
              };
              setCachedUser(session.account_id, currentUser);
            }
          } catch (e) {
            console.log(`[AUTH] Profile missing, using fallback.`);
          }
        }
      } else if (session) {
        db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
        event.cookies.delete(SESSION_COOKIE.NAME, { path: SESSION_COOKIE.OPTIONS.path });
      }
    }

    if (!currentUser) {
      currentUser = generateAnonymousSessionUser(guestRole) as any;
    }

    event.locals.user = currentUser;

    if (dev || GLOBAL_SETTINGS.DEV.IS_DEVMODE) {
      event.locals.user = GLOBAL_SETTINGS.DEV.DEV_ACCOUNTS.DEV_ADMIN as any;
    }
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
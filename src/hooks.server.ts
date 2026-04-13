import db from "$lib/server/db";
import { decrypt } from '$lib/server/auth/crypto';
import { DEFAULT_ROLES, SETUP_ROLES } from "$lib/config/cloudfiles/roles";
import { getCachedUser, setCachedUser } from "$lib/server/auth/userCache";
import { readSecureFile } from "$lib/server/auth/secureHandler";
import { SYSTEM_CONFIG } from "$lib/config/filesystem";
import { GLOBAL_SETTINGS, APP_COOKIE, APP_EXTENSIONS } from "$lib/config/globalsettings";
import { dev } from '$app/environment';
import { SESSION_COOKIE } from '$lib/config/cookies/session';
import { generateAnonymousSessionUser } from "$lib/config/cloudfiles/user";
import { env } from '$env/dynamic/private';
import { redirect } from "@sveltejs/kit";

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
  const host = event.url.hostname;

  // Define what your "Main" domain is (including localhost for testing)
  const isMainDomain = host === GLOBAL_SETTINGS.APP_INFO.BASE_DOMAIN || host === 'localhost' || host === '127.0.0.1';

  // 🚨 MULTI-TENANT TRAFFIC COP
  const path = event.url.pathname;

  if (isMainDomain) {
    // If they are on the main sales site and try to access the app, kick them to the landing page
    if (path.startsWith('/files') || path.startsWith('/dev')) {
      throw redirect(303, '/');
    }
  }

  // ==========================================
  // Organisation IDENTIFICATION
  // ==========================================
  if (!isMainDomain) {
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
            parsedRoles = parsed;
          }
        }
      } catch (e) { /* fallback to defaults */ }

      if (Object.keys(parsedRoles).length === 0) parsedRoles = DEFAULT_ROLES;

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
      let operatorTier: 'designer' | 'developer' | 'support' | 'owner' | null = null;
      let rawEmail = '';

      if (sessionId) {
        const session = db.prepare(`SELECT account_id, expires_at FROM sessions WHERE id = ? AND organisation_id = ?`)
          .get(sessionId, org.organisation_id) as { account_id: string, expires_at: number } | undefined;

        if (session && session.expires_at > Date.now()) {
          currentUser = getCachedUser(session.account_id);

          if (!currentUser) {
            try {
              const profilePath = `/${SYSTEM_CONFIG.CONFIG_FOLDER}/${SYSTEM_CONFIG.ACCOUNTS_FOLDER.join('')}/${session.account_id}${APP_EXTENSIONS.SYS}${APP_EXTENSIONS.SECURE_MODIFIER}`;
              const profileData = await readSecureFile(orgConfig, profilePath);

              if (profileData) {
                currentUser = {
                  id: session.account_id,
                  name: profileData.profile?.displayName || profileData.profile?.firstName || 'Unknown User',
                  role: profileData.access?.roles?.[0] || newUserRole,
                  color: profileData.profile?.color || '#888888',
                  overrides: profileData.access?.overrides || []
                };
                setCachedUser(session.account_id, currentUser);
              }
            } catch (e) {
              console.log(`[AUTH] Profile missing, using fallback.`);
            }
          }

          // --- PLATFORM OPERATOR CHECK ---
          try {
            const authPath = `/${SYSTEM_CONFIG.CONFIG_FOLDER}/${SYSTEM_CONFIG.ACCOUNTS_FILE.join('')}`;
            const authData = await readSecureFile(orgConfig, authPath);
            if (authData && authData.identities) {
              const foundEntry = Object.entries(authData.identities).find(([email, info]: any) => info.accountId === session.account_id);
              if (foundEntry) rawEmail = foundEntry[0];
            }
          } catch (e) { }

          if (rawEmail) {
            const email = rawEmail.toLowerCase();
            if ((env.OPS_OWNERS || '').toLowerCase().includes(email)) operatorTier = 'owner';
            else if ((env.OPS_SUPPORT || '').toLowerCase().includes(email)) operatorTier = 'support';
            else if ((env.OPS_DEVELOPERS || '').toLowerCase().includes(email)) operatorTier = 'developer';
            else if ((env.OPS_DESIGNERS || '').toLowerCase().includes(email)) operatorTier = 'designer';
          }
        } else if (session) {
          db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
          event.cookies.delete(SESSION_COOKIE.NAME, { path: SESSION_COOKIE.OPTIONS.path });
        }
      }

      if (!currentUser) {
        currentUser = generateAnonymousSessionUser(guestRole) as any;
      }

      // ==========================================
      // 🚨 GOD MODE: ROLE SIMULATOR & DEV MODE
      // ==========================================
      let isSimulating = false;
      let isDevMode = event.cookies.get(APP_COOKIE.DEVMODE) === 'true';

      if (operatorTier === 'support' || operatorTier === 'owner') {
        const simulatedRole = event.cookies.get(APP_COOKIE.SIMULATION);
        if (simulatedRole) {
          isSimulating = true;
          if (simulatedRole === 'Guest (Not Logged In)') {
            currentUser = generateAnonymousSessionUser(guestRole) as any;
            currentUser.role = guestRole; // 🚨 FORCE the role to match SETUP_ROLES.GUEST
          } else {
            currentUser.role = simulatedRole;
            currentUser.overrides = [];
          }
        }
      }

      event.locals.user = currentUser;
      if (operatorTier) {
        event.locals.operator = {
          tier: operatorTier,
          isSimulating,
          isDevMode,
          email: rawEmail
        };
      }
    }
  } // <--- END OF THE !isMainDomain BLOCK

  // THIS MUST BE AT THE VERY BOTTOM, OUTSIDE ALL IF BLOCKS!
  return await resolve(event);
}

const FOUR_HOURS = 4 * 60 * 60 * 1000;
setInterval(async () => {
  try {
    const activeOrgs = db.prepare('SELECT * FROM organisations WHERE is_active = 1').all() as OrganisationRow[];
    for (const org of activeOrgs) {
      try {
        console.log(`Auto-synced: ${org.subdomain}`);
      } catch (e) {
        console.error(`Sync failed for ${org.subdomain}`, e);
      }
    }
  } catch (err) {
    console.error("Failed to fetch active orgs for interval sync", err);
  }
}, FOUR_HOURS);
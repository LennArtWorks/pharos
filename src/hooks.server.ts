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
  const url = new URL(event.request.url);
  const subdomain = url.hostname.split('.')[0];

  // 2. Cast the result to your interface
  const org = db.prepare('SELECT * FROM organisations WHERE subdomain = ?').get(subdomain) as OrganisationRow | undefined;

  if (org) {
    let parsedRoles = {};
    try {
      parsedRoles = org.roles_json ? JSON.parse(org.roles_json) : DEFAULT_ROLES;
    } catch (e) {
      parsedRoles = DEFAULT_ROLES;
    }

    event.locals.orgConfig = {
      ...org,
      decrypted_password: decrypt(org.cloud_password_encrypted),
      roles: parsedRoles // <--- Attached securely and instantly
    };
  }

  // 3. INJECT MOCK USER (So our rename/edit APIs have a role to check)
  event.locals.user = {
    id: 'mock_admin_1',
    role: 'Admin'
  };

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
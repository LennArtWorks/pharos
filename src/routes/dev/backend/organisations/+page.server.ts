import { fail } from '@sveltejs/kit';
import db from '$lib/server/db';
import { encrypt } from '$lib/server/auth/crypto';

export interface SafeOrganisation {
  organisation_id: string;
  subdomain: string;
  organization_name: string;
  cloud_name: string;
  cloud_url: string;
  cloud_username: string;
  cloud_directory: string;
  is_active: number;
}

export const load = async () => {
  const stmt = db.prepare(`
    SELECT 
      organisation_id, subdomain, organization_name, cloud_name, 
      cloud_url, cloud_username, cloud_directory, is_active 
    FROM organisations
    ORDER BY created_at DESC
  `);

  return { organisations: stmt.all() as SafeOrganisation[] };
};

export const actions = {
  create: async ({ request }) => {
    const data = await request.formData();
    const subdomain = data.get('subdomain')?.toString().toLowerCase().trim();
    const organization_name = data.get('organization_name')?.toString().trim();
    const cloud_name = data.get('cloud_name')?.toString().trim() || 'sciebo';
    const cloud_url = data.get('cloud_url')?.toString().trim();
    const cloud_username = data.get('cloud_username')?.toString().trim();
    const cloud_password = data.get('cloud_password')?.toString();
    const cloud_directory = data.get('cloud_directory')?.toString().trim() || '';

    if (!subdomain || !organization_name || !cloud_url || !cloud_username || !cloud_password) {
      return fail(400, { error: 'All fields except directory are required.' });
    }

    const checkStmt = db.prepare('SELECT organisation_id FROM organisations WHERE subdomain = ?');
    if (checkStmt.get(subdomain)) return fail(400, { error: 'Subdomain already exists.' });

    const organisation_id = `orga_${Date.now()}`;
    const cloud_password_encrypted = encrypt(cloud_password);

    try {
      db.prepare(`
        INSERT INTO organisations (
          organisation_id, subdomain, organization_name, cloud_name, 
          cloud_url, cloud_username, cloud_password_encrypted, cloud_directory
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(organisation_id, subdomain, organization_name, cloud_name, cloud_url, cloud_username, cloud_password_encrypted, cloud_directory);

      return { success: true };
    } catch (err: any) {
      return fail(500, { error: 'Database error.' });
    }
  },

  update: async ({ request }) => {
    const data = await request.formData();
    const organisation_id = data.get('organisation_id')?.toString();
    const subdomain = data.get('subdomain')?.toString().toLowerCase().trim();
    const organization_name = data.get('organization_name')?.toString().trim();
    const cloud_url = data.get('cloud_url')?.toString().trim();
    const cloud_username = data.get('cloud_username')?.toString().trim();
    const cloud_password = data.get('cloud_password')?.toString();
    const cloud_directory = data.get('cloud_directory')?.toString().trim() || '';
    const is_active = data.get('is_active') === 'true' ? 1 : 0;

    if (!organisation_id || !subdomain || !organization_name || !cloud_url || !cloud_username) {
      return fail(400, { error: 'Missing required fields.' });
    }

    try {
      if (cloud_password && cloud_password.trim() !== '') {
        const encrypted = encrypt(cloud_password);
        db.prepare(`UPDATE organisations SET subdomain = ?, organization_name = ?, cloud_url = ?, cloud_username = ?, cloud_password_encrypted = ?, cloud_directory = ?, is_active = ? WHERE organisation_id = ?`)
          .run(subdomain, organization_name, cloud_url, cloud_username, encrypted, cloud_directory, is_active, organisation_id);
      } else {
        db.prepare(`UPDATE organisations SET subdomain = ?, organization_name = ?, cloud_url = ?, cloud_username = ?, cloud_directory = ?, is_active = ? WHERE organisation_id = ?`)
          .run(subdomain, organization_name, cloud_url, cloud_username, cloud_directory, is_active, organisation_id);
      }
      return { success: true };
    } catch (err: any) {
      return fail(500, { error: 'Database error.' });
    }
  },

  delete: async ({ request }) => {
    const data = await request.formData();
    const organisation_id = data.get('organisation_id')?.toString();
    if (!organisation_id) return fail(400, { error: 'Missing ID.' });

    try {
      db.prepare('DELETE FROM organisations WHERE organisation_id = ?').run(organisation_id);
      return { success: true };
    } catch (err: any) {
      return fail(500, { error: 'Database error.' });
    }
  }
};
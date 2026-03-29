import db from '$lib/server/db';
import fs from 'fs';
import path from 'path';
import { GLOBAL_SETTINGS } from '$lib/config/globalsettings';
import { FILE_TYPE_CONFIG, SYSTEM_CONFIG } from '$lib/config/filesystem';
import { getCachedUser } from '$lib/server/auth/userCache'; // Hook into the live RAM cache

export const load = async ({ locals }) => {
  const orgCount = (db.prepare('SELECT COUNT(*) as c FROM organisations').get() as { c: number }).c;

  const allSessions = db.prepare('SELECT * FROM sessions ORDER BY created_at DESC LIMIT 50').all() as any[];
  const rateLimits = db.prepare('SELECT * FROM rate_limits ORDER BY window_start DESC LIMIT 20').all() as any[];

  const now = Date.now();
  let activeCount = 0;
  const roleBreakdown: Record<string, number> = {};

  // Enrich sessions with RAM Cache Data
  const enrichedSessions = allSessions.map(session => {
    const isActive = session.expires_at > now;
    let name = 'Unknown / Uncached';
    let role = 'Unknown';

    if (isActive) {
      activeCount++;
      const user = getCachedUser(session.account_id);
      if (user) {
        name = user.name || name;
        role = user.role || role;
      }

      // Count roles for the dashboard
      roleBreakdown[role] = (roleBreakdown[role] || 0) + 1;
    }

    return { ...session, isActive, name, role };
  });

  let pkgInfo = { version: '0.0.0', deps: {} as Record<string, string>, devDeps: {} as Record<string, string> };
  try {
    const pkgPath = path.resolve('package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    pkgInfo = {
      version: pkg.version,
      deps: pkg.dependencies || {},
      devDeps: pkg.devDependencies || {}
    };
  } catch (e) {
    console.error('Could not read package.json');
  }

  return {
    context: {
      org: locals.orgConfig ? {
        id: locals.orgConfig.organisation_id,
        name: locals.orgConfig.organization_name,
        subdomain: locals.orgConfig.subdomain,
        cloud: locals.orgConfig.cloud_name,
        dir: locals.orgConfig.cloud_directory
      } : null,
      user: locals.user
    },
    stats: {
      orgs: orgCount,
      rateLimits,
      sessions: {
        total: enrichedSessions.length,
        active: activeCount,
        expired: enrichedSessions.length - activeCount,
        list: enrichedSessions,
        roles: roleBreakdown
      }
    },
    system: pkgInfo,
    config: {
      global: {
        ACCOUNT: GLOBAL_SETTINGS.ACCOUNT,
        SECURITY: GLOBAL_SETTINGS.SECURITY,
        APP_INFO: GLOBAL_SETTINGS.APP_INFO,
        FILES: GLOBAL_SETTINGS.FILES,
        WEBSOCKETS: { SERVER_SYNC_INTERVAL_MS: GLOBAL_SETTINGS.WEBSOCKETS.SERVER_SYNC_INTERVAL_MS }
      },
      filesystem: FILE_TYPE_CONFIG,
      sys: SYSTEM_CONFIG
    }
  };
};
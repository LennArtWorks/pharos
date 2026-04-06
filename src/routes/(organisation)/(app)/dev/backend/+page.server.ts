// src/routes/dev/backend/+page.server.ts
import db from '$lib/server/db';
import fs from 'fs';
import path from 'path';
import { GLOBAL_SETTINGS } from '$lib/config/globalsettings';
import { FILE_TYPE_CONFIG, SYSTEM_CONFIG } from '$lib/config/filesystem';
import { getCachedUser } from '$lib/server/auth/userCache';
import { getCloudClient, type CloudConfig } from '$lib/server/cloud/origin/client';
import { peekAuditLogs } from '$lib/server/cache';

export const load = async ({ locals }) => {
  const orgCount = (db.prepare('SELECT COUNT(*) as c FROM organisations').get() as { c: number }).c;
  const allSessions = db.prepare('SELECT * FROM sessions ORDER BY created_at DESC LIMIT 50').all() as any[];
  const rateLimits = db.prepare('SELECT * FROM rate_limits ORDER BY window_start DESC LIMIT 20').all() as any[];

  const now = Date.now();
  let activeCount = 0;
  const roleBreakdown: Record<string, number> = {};

  // NEW: Fetch Audit Logs directly from the Organization's WebDAV + RAM
  let auditLogs: any[] = [];

  function parseLogLine(line: string) {
    const match = line.match(/^\[(.*?)\] \[(.*?)\] \[(.*?)\] - (.*)$/);
    if (!match) return null;
    return {
      created_at: match[1],
      operator_email: match[2],
      action: match[3],
      details: match[4]
    };
  }

  if (locals.orgConfig) {
    const orgId = locals.orgConfig.organisation_id;
    const client = getCloudClient(locals.orgConfig as CloudConfig);
    const logPath = `/${SYSTEM_CONFIG.CONFIG_FOLDER}/audit.log`;

    try {
      // 1. Get saved logs from Sciebo
      const rawContent = await client.getFileContents(logPath, { format: 'text' });
      const savedLines = (rawContent as string).split('\n').filter(Boolean);

      // 2. Get live pending logs from RAM
      const pendingLines = peekAuditLogs(orgId);

      // 3. Combine, parse, and reverse so newest is at the top
      auditLogs = [...savedLines, ...pendingLines]
        .map(parseLogLine)
        .filter(Boolean)
        .reverse()
        .slice(0, 100);

    } catch (e) {
      // If WebDAV read fails (or file doesn't exist yet), just show RAM buffer
      const pendingLines = peekAuditLogs(orgId);
      auditLogs = pendingLines.map(parseLogLine).filter(Boolean).reverse();
    }
  }

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
      roleBreakdown[role] = (roleBreakdown[role] || 0) + 1;
    }
    return { ...session, isActive, name, role };
  });

  let pkgInfo = { version: '0.0.0', deps: {} as Record<string, string>, devDeps: {} as Record<string, string> };
  try {
    const pkgPath = path.resolve('package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    pkgInfo = { version: pkg.version, deps: pkg.dependencies || {}, devDeps: pkg.devDependencies || {} };
  } catch (e) { console.error('Could not read package.json'); }

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
      auditLogs,
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
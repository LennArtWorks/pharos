// src/lib/server/audit.ts
import { pushAuditLog } from '$lib/server/cache';
import type { CloudConfig } from '$lib/server/cloud/origin/client';

/**
 * Formats and pushes an action into the RAM buffer.
 * It will be flushed to the organisation's WebDAV in the next sync cycle.
 */
export function logOrganisationAction(
  orgId: string,
  accountId: string,
  action: string,
  details: string
) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

  // Format: [YYYY-MM-DD HH:MM:SS] [ACCOUNT_ID] [ACTION] - DETAILS
  const logEntry = `[${timestamp}] [${accountId}] [${action}] - ${details}\n`;

  pushAuditLog(orgId, logEntry);
}

/**
 * Operators (Admins) performing actions on an organisation's behalf.
 * Explicitly tracked inside the organisation's own WebDAV for absolute transparency.
 */
export function logOperatorAction(
  operatorEmail: string,
  action: string,
  orgId: string | null = null,
  details: Record<string, any> = {}
) {
  if (orgId) {
    logOrganisationAction(
      orgId,
      `SYSTEM_OPERATOR (${operatorEmail})`,
      action,
      JSON.stringify(details)
    );
  }
}
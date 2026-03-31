import db from '$lib/server/db';
import crypto from 'crypto';

export function logOperatorAction(
  operatorEmail: string,
  action: string,
  organisationId: string | null = null,
  details: Record<string, any> = {}
) {
  try {
    db.prepare(`
      INSERT INTO audit_logs (id, organisation_id, operator_email, action, details) 
      VALUES (?, ?, ?, ?, ?)
    `).run(
      `log_${crypto.randomUUID()}`,
      organisationId,
      operatorEmail,
      action,
      JSON.stringify(details)
    );
  } catch (err) {
    console.error('[AUDIT LOG FAILED] Critical failure saving operator action:', err);
  }
}
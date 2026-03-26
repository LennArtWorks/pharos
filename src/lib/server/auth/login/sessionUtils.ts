// src/lib/server/auth/login/sessionUtils.ts
import crypto from 'crypto';
import type { Database } from 'better-sqlite3';
import { GLOBAL_SETTINGS } from '$lib/config/globalsettings';

export function createSession(db: Database, cookies: any, orgId: string, accountId: string) {
  const sessionId = crypto.randomUUID();
  const sessionExpiresAt = Date.now() + (GLOBAL_SETTINGS.ACCOUNT.LOGIN_SESSION_DURATION * 1000);

  db.prepare(`
    INSERT INTO sessions (id, organisation_id, account_id, expires_at) 
    VALUES (?, ?, ?, ?)
  `).run(sessionId, orgId, accountId, sessionExpiresAt);

  cookies.set('fsr_session', sessionId, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: GLOBAL_SETTINGS.ACCOUNT.LOGIN_SESSION_DURATION
  });
}
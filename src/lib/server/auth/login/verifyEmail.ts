import { fail, redirect } from '@sveltejs/kit';
import crypto from 'crypto';
import db from '$lib/server/db';
import { readSecureFile } from '$lib/server/auth/secureHandler';
import { SYSTEM_CONFIG } from '$lib/config/filesystem';
import { createSession } from './sessionUtils';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';

export const verifyEmail = async ({ request, locals, cookies }: any) => {
  const data = await request.formData();
  const email = data.get('email')?.toString().toLowerCase().trim();
  const otp = data.get('otp')?.toString().trim();
  const orgConfig = locals.orgConfig;

  if (!email || !otp) return fail(400, { email, error: 'Missing data.' });

  const tokenHash = crypto.createHash('sha256').update(otp).digest('hex');
  const record = db.prepare(`SELECT id, expires_at FROM verification_tokens WHERE identifier = ? AND token_hash = ? AND type = 'email_otp' AND organisation_id = ?`).get(email, tokenHash, orgConfig.organisation_id) as any;

  if (!record || Date.now() > record.expires_at) return fail(401, { email, error: 'Invalid or expired OTP.' });
  db.prepare('DELETE FROM verification_tokens WHERE id = ?').run(record.id);

  const accountsPath = `${SYSTEM_CONFIG.CONFIG_FOLDER}/${SYSTEM_CONFIG.ACCOUNTS_FILE.join('')}`;
  const accountsDb = await readSecureFile(orgConfig, accountsPath) || { identities: {} };

  if (accountsDb.identities[email]) {
    const user = accountsDb.identities[email];
    if (!user.isActive) return fail(403, { email, error: 'Account deactivated.' });
    if (user.mfaSecret) return { success: true, email, step: 'challenge_totp' };

    createSession(db, cookies, orgConfig.organisation_id, user.accountId);
    throw redirect(303, '/files');
  } else {
    const totp = new OTPAuth.TOTP({
      issuer: orgConfig.organization_name,
      label: email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: new OTPAuth.Secret({ size: 20 })
    });

    const secret = totp.secret.base32;
    const otpauthUrl = totp.toString();
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    const expiresAt = Date.now() + 30 * 60 * 1000;
    db.prepare(`INSERT INTO verification_tokens (id, organisation_id, identifier, token_hash, type, expires_at) VALUES (?, ?, ?, ?, ?, ?)`).run(crypto.randomUUID(), orgConfig.organisation_id, email, secret, 'totp_setup', expiresAt);

    return { success: true, email, step: 'setup_2fa', qrCodeUrl, setupKey: secret };
  }
};
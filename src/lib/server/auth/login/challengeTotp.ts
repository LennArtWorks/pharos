import { fail, redirect } from '@sveltejs/kit';
import db from '$lib/server/db';
import { readSecureFile } from '$lib/server/auth/secureHandler';
import { SYSTEM_CONFIG } from '$lib/config/filesystem';
import { createSession } from './sessionUtils';
import * as OTPAuth from 'otpauth';

export const challengeTotp = async ({ request, locals, cookies }: any) => {
  const data = await request.formData();
  const email = data.get('email')?.toString().toLowerCase().trim();
  const otp = data.get('otp')?.toString().trim();
  const orgConfig = locals.orgConfig;

  if (!email || !otp) return fail(400, { email, error: 'Missing data.' });

  const accountsPath = `${SYSTEM_CONFIG.CONFIG_FOLDER}/${SYSTEM_CONFIG.ACCOUNTS_FILE.join('')}`;
  const accountsDb = await readSecureFile(orgConfig, accountsPath);
  const user = accountsDb?.identities[email];

  if (!user || !user.mfaSecret) return fail(400, { email, error: 'User setup invalid.' });

  const totp = new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(user.mfaSecret)
  });
  const isValid = totp.validate({ token: otp, window: 1 }) !== null;

  if (!isValid) return fail(401, { email, error: 'Invalid authenticator code.' });

  createSession(db, cookies, orgConfig.organisation_id, user.accountId);
  throw redirect(303, '/files');
};
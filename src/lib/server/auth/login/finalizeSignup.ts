import { fail, redirect } from '@sveltejs/kit';
import db from '$lib/server/db';
import { readSecureFile, writeSecureFile } from '$lib/server/cloud/secureHandler';
import { FILE_MODIFIERS, FILE_TYPE_CONFIG, SYSTEM_CONFIG } from '$lib/config/filesystem';
import { USER_CONFIG } from '$lib/config/user';
import { getDefaultProfile } from '$lib/utils/user';
import { createSession } from './sessionUtils';
import * as OTPAuth from 'otpauth';

export const finalizeSignup = async ({ request, locals, cookies }: any) => {
  const data = await request.formData();
  const email = data.get('email')?.toString().toLowerCase().trim();
  const actionType = data.get('actionType')?.toString();
  const totpCode = data.get('totpCode')?.toString().trim();
  const orgConfig = locals.orgConfig;

  if (!email) return fail(400, { email, error: 'Missing email.' });

  const record = db.prepare(`SELECT id, token_hash as secret FROM verification_tokens WHERE identifier = ? AND type = 'totp_setup' AND organisation_id = ?`).get(email, orgConfig.organisation_id) as any;

  let mfaSecretToSave = null;

  if (actionType === 'setup') {
    if (!record || !totpCode) return fail(400, { email, error: 'Missing setup data.' });

    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(record.secret)
    });
    // window: 1 allows a 30-second drift in case the user's clock is slightly off
    const isValid = totp.validate({ token: totpCode, window: 1 }) !== null;

    if (!isValid) return fail(401, { email, error: 'Invalid authenticator code.', step: 'setup_2fa' });
    mfaSecretToSave = record.secret;
  }

  if (record) db.prepare('DELETE FROM verification_tokens WHERE id = ?').run(record.id);

  const accountsPath = `${SYSTEM_CONFIG.CONFIG_FOLDER}/${SYSTEM_CONFIG.ACCOUNTS_FILE.join('')}`;
  let accountsDb = await readSecureFile(orgConfig, accountsPath) || { _meta: { schemaVersion: "1.0", lastUpdated: Date.now() }, identities: {} };

  const accountId = `${USER_CONFIG.ID_PREFIX}_${Date.now()}`;

  accountsDb.identities[email] = {
    accountId,
    authType: mfaSecretToSave ? "email_totp" : "email",
    mfaSecret: mfaSecretToSave,
    isActive: true,
  };

  await writeSecureFile(orgConfig, accountsPath, accountsDb);

  const profilePath = `${SYSTEM_CONFIG.CONFIG_FOLDER}/${SYSTEM_CONFIG.ACCOUNTS_FOLDER.join('')}/${accountId}${FILE_TYPE_CONFIG.internal.sysfile.ext[0]}${FILE_MODIFIERS.SECURE}`;
  await writeSecureFile(orgConfig, profilePath, getDefaultProfile(accountId, email));

  createSession(db, cookies, orgConfig.organisation_id, accountId);
  throw redirect(303, '/files');
};
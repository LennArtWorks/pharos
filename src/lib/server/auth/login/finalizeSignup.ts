import { fail, redirect } from '@sveltejs/kit';
import db from '$lib/server/db';
import { readSecureFile, writeSecureFile } from '$lib/server/auth/secureHandler';
import { FILE_MODIFIERS, FILE_TYPE_CONFIG, SYSTEM_CONFIG } from '$lib/config/filesystem';
import { SETUP_ROLES } from '$lib/config/cloudfiles/roles';
import { createNewUser } from '$lib/utils/config/cloudfiles/user';
import { generateDefaultAccountsRegistry } from '$lib/config/cloudfiles/accounts';
import { createSession } from './sessionUtils';
import * as OTPAuth from 'otpauth';

export const finalizeSignup = async ({ request, locals, cookies }: any) => {
  const data = await request.formData();
  const email = data.get('email')?.toString().toLowerCase().trim();
  const actionType = data.get('actionType')?.toString();
  const totpCode = data.get('totpCode')?.toString().trim();
  const providedName = data.get('name')?.toString().trim();

  const orgConfig = locals.orgConfig;

  if (!email) return fail(400, { email, error: 'Missing email.' });

  const record = db.prepare(`SELECT id, token_hash as secret FROM verification_tokens WHERE identifier = ? AND type = 'totp_setup' AND organisation_id = ?`).get(email, orgConfig.organisation_id) as any;

  let mfaSecretToSave = null;

  if (actionType === 'setup') {
    if (!record || !totpCode) return fail(400, { email, error: 'Missing setup data.' });

    const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(record.secret) });
    const isValid = totp.validate({ token: totpCode, window: 1 }) !== null;

    if (!isValid) return fail(401, { email, error: 'Invalid authenticator code.', step: 'setup_2fa' });
    mfaSecretToSave = record.secret;
  }

  if (record) db.prepare('DELETE FROM verification_tokens WHERE id = ?').run(record.id);

  const accountsPath = `${SYSTEM_CONFIG.CONFIG_FOLDER}/${SYSTEM_CONFIG.ACCOUNTS_FILE.join('')}`;

  // 1. Load registry or create a fresh one using the factory
  let accountsDb = await readSecureFile(orgConfig, accountsPath) || generateDefaultAccountsRegistry();

  const userRole = orgConfig.newUserRole || SETUP_ROLES.NEW_USER;

  // 2. Generate everything at once!
  const newUser = createNewUser(email, mfaSecretToSave, providedName, userRole);

  // 3. Save to Master Accounts Registry
  accountsDb.identities[email] = newUser.identityEntry;
  await writeSecureFile(orgConfig, accountsPath, accountsDb);

  // 4. Save to Individual User Profile
  const profilePath = `${SYSTEM_CONFIG.CONFIG_FOLDER}/${SYSTEM_CONFIG.ACCOUNTS_FOLDER.join('')}/${newUser.accountId}${FILE_TYPE_CONFIG.internal.sysfile.ext[0]}${FILE_MODIFIERS.SECURE}`;
  await writeSecureFile(orgConfig, profilePath, newUser.profileEntry);

  // 5. Create Session
  createSession(db, cookies, orgConfig.organisation_id, newUser.accountId);
  throw redirect(303, '/files');
};
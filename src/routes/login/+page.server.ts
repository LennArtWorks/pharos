import { fail, redirect } from '@sveltejs/kit';
import crypto from 'crypto';
import db from '$lib/server/db';
import { checkRateLimit } from '$lib/server/auth/rateLimit';
import { readSecureFile, writeSecureFileWithBackup } from '$lib/server/cloud/secureHandler';
import { SYSTEM_CONFIG } from '$lib/config/filesystem';
import { GLOBAL_SETTINGS } from '$lib/config/globalsettings.js';

// Helper to generate a 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const actions = {
  requestOtp: async ({ request, getClientAddress, locals }: { request: Request; getClientAddress: () => string; locals: App.Locals }) => {
    const data = await request.formData();
    const email = data.get('email')?.toString().toLowerCase().trim();

    if (!email || !email.includes('@')) {
      return fail(400, { email, error: 'Invalid email address.' });
    }

    const orgId = locals.orgConfig?.organisation_id;
    if (!orgId) {
      return fail(500, { error: 'Organization configuration missing.' });
    }

    // 1. Anti-Raid Protection
    const ip = getClientAddress();
    if (!checkRateLimit(ip, 'request_otp', orgId)) {
      return fail(429, { email, error: 'Too many requests. Please try again in 15 minutes.' });
    }

    // 2. Generate and Hash the Token (OTP)
    const rawOtp = generateOTP();
    // We hash it using SHA-256 for fast, secure local storage (Argon2 is overkill for a 6-digit 15-min OTP)
    const tokenHash = crypto.createHash('sha256').update(rawOtp).digest('hex');
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes from now

    // 3. Save to SQLite (Fast, ephemeral storage)
    try {
      // Clear any existing OTPs for this email to prevent spamming the DB
      db.prepare('DELETE FROM verification_tokens WHERE identifier = ? AND organisation_id = ?').run(email, orgId);

      db.prepare(`
        INSERT INTO verification_tokens (id, organisation_id, identifier, token_hash, type, expires_at) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(crypto.randomUUID(), orgId, email, tokenHash, 'otp', expiresAt);
    } catch (err) {
      console.error('Database error storing OTP:', err);
      return fail(500, { error: 'Internal server error.' });
    }

    // 4. Handle Email Dispatch based on .env configuration
    const hasSmtp = !!process.env.SMTP_HOST;

    if (hasSmtp) {
      // TODO: Implement actual nodemailer logic here
      console.log(`[MAIL MOCK] Sending OTP ${rawOtp} to ${email}`);
    } else {
      // If SMTP is not configured, we might want to fail or rely purely on Authenticator app logic.
      // For development, we'll just log it.
      console.log(`[DEV MODE] SMTP not configured. OTP for ${email} is: ${rawOtp}`);
    }

    // 5. Success! Tell the frontend to switch to the "Enter OTP" view
    return {
      success: true,
      email,
      step: 'verify',
      message: hasSmtp ? 'OTP sent to your email.' : 'Development mode: Check server console for OTP.'
    };
  },

  verifyOtp: async ({ request, getClientAddress, locals, cookies }) => {
    const data = await request.formData();
    const email = data.get('email')?.toString().toLowerCase().trim();
    const otp = data.get('otp')?.toString().trim();

    if (!email || !otp) return fail(400, { error: 'Missing email or OTP.' });

    const orgConfig = locals.orgConfig;
    if (!orgConfig) return fail(500, { error: 'Tenant config missing.' });

    // 1. Rate Limiting
    const ip = getClientAddress();
    if (!checkRateLimit(ip, 'verify_otp', orgConfig.organisation_id)) {
      return fail(429, { error: 'Too many attempts. Please try again later.' });
    }

    // 2. Hash the incoming OTP to compare with the database
    const tokenHash = crypto.createHash('sha256').update(otp).digest('hex');

    // 3. Verify against SQLite
    const stmt = db.prepare(`
      SELECT id, expires_at FROM verification_tokens 
      WHERE identifier = ? AND token_hash = ? AND organisation_id = ?
    `);
    const record = stmt.get(email, tokenHash, orgConfig.organisation_id) as { id: string, expires_at: number } | undefined;

    if (!record) {
      return fail(401, { error: 'Invalid or expired OTP.' });
    }

    if (Date.now() > record.expires_at) {
      db.prepare('DELETE FROM verification_tokens WHERE id = ?').run(record.id);
      return fail(401, { error: 'OTP has expired. Please request a new one.' });
    }

    // 4. Token is valid! Delete it so it can't be reused.
    db.prepare('DELETE FROM verification_tokens WHERE id = ?').run(record.id);

    // 5. The Cloud Handshake: Decrypt accounts.fsrsecure
    const accountsPath = `${SYSTEM_CONFIG.CONFIG_FOLDER}/${SYSTEM_CONFIG.ACCOUNTS_FILE.join('')}`;
    let accountsDb = await readSecureFile(orgConfig, accountsPath);

    // If the file doesn't exist yet, scaffold it
    if (!accountsDb) {
      accountsDb = {
        _meta: { schemaVersion: "1.0", lastUpdated: Date.now(), description: "Encrypted identity registry." },
        identities: {}
      };
    }

    // 6. Check if user exists, otherwise REGISTER them
    let accountId;
    if (accountsDb.identities[email]) {
      accountId = accountsDb.identities[email].accountId;
      if (!accountsDb.identities[email].isActive) return fail(403, { error: 'Account is deactivated.' });
    } else {
      // Create new account
      accountId = `usr_${Date.now()}`;
      accountsDb.identities[email] = {
        accountId,
        authType: "magic_link", // Or 'otp'
        isActive: true,
        securityFlags: {}
      };
      // Save updated registry back to WebDAV
      await writeSecureFileWithBackup(orgConfig, accountsPath, accountsDb);

      // TODO: In the future, we should also create their empty profile file here:
      // `.config/accounts.sysfolder/${accountId}.fsrsys`
    }

    // 7. Create the Session in SQLite
    const sessionId = crypto.randomUUID();
    const sessionExpiresAt = Date.now() + (GLOBAL_SETTINGS.ACCOUNT.LOGIN_SESSION_DURATION * 1000); // 30 days

    db.prepare(`
      INSERT INTO sessions (id, organisation_id, account_id, expires_at) 
      VALUES (?, ?, ?, ?)
    `).run(sessionId, orgConfig.organisation_id, accountId, sessionExpiresAt);

    // 8. Set the secure browser cookie
    cookies.set('fsr_session', sessionId, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: GLOBAL_SETTINGS.ACCOUNT.LOGIN_SESSION_DURATION  // 30 days in seconds *TODO* 
    });

    // 9. Redirect the user into the OS
    throw redirect(303, '/files');
  }
};
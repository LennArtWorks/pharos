import { fail } from '@sveltejs/kit';
import crypto from 'crypto';
import db from '$lib/server/db';
import { checkRateLimit } from '$lib/server/auth/rateLimit';
import { sendOtpEmail } from '$lib/server/notifications/email';

export const discover = async ({ request, getClientAddress, locals }: any) => {
  const data = await request.formData();
  const email = data.get('email')?.toString().toLowerCase().trim();

  if (!email || !email.includes('@')) return fail(400, { email, error: 'Invalid email address.' });
  const orgId = locals.orgConfig?.organisation_id;
  if (!orgId) return fail(500, { email, error: 'Organization configuration missing.' });

  if (!checkRateLimit(getClientAddress(), 'discover', orgId)) {
    return fail(429, { email, error: 'Too many requests. Please try again later.' });
  }

  // Use crypto.getRandomValues for a cryptographically secure 6-digit OTP
  const otpBuffer = new Uint32Array(1);
  crypto.getRandomValues(otpBuffer);
  const rawOtp = (100000 + (otpBuffer[0] % 900000)).toString();
  const tokenHash = crypto.createHash('sha256').update(rawOtp).digest('hex');
  const expiresAt = Date.now() + 15 * 60 * 1000;

  db.prepare('DELETE FROM verification_tokens WHERE identifier = ? AND organisation_id = ?').run(email, orgId);
  db.prepare(`INSERT INTO verification_tokens (id, organisation_id, identifier, token_hash, type, expires_at) VALUES (?, ?, ?, ?, ?, ?)`).run(crypto.randomUUID(), orgId, email, tokenHash, 'email_otp', expiresAt);
  await sendOtpEmail(email, rawOtp);

  return { success: true, email, step: 'verify_email' };
};
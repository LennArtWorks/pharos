import nodemailer from 'nodemailer';
import 'dotenv/config';
import { GLOBAL_SETTINGS } from '$lib/config/globalsettings';

// Create reusable transporter object using Zoho SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtppro.zoho.eu', // Use .eu for European Zoho accounts
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOtpEmail(to: string, otp: string) {
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">${GLOBAL_SETTINGS.APP_INFO.NAME} Login Code</h2>
      <p>Here is your one-time password to access your workspace. It expires in 15 minutes.</p>
      <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 24px 0;">
        ${otp}
      </div>
      <p style="color: #71717a; font-size: 14px;">If you didn't request this code, you can safely ignore this email.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"${GLOBAL_SETTINGS.APP_INFO.NAME}" <${process.env.SMTP_ALIAS}>`,
      to,
      subject: `Your ${GLOBAL_SETTINGS.APP_INFO.NAME} Login Code`,
      html: htmlContent,
    });
    console.log(`[MAIL SUCCESS] OTP sent to ${to}`);
  } catch (error) {
    console.error(`[MAIL ERROR] Failed to send OTP to ${to}:`, error);
    throw new Error('Failed to send email. Please try again.');
  }
}
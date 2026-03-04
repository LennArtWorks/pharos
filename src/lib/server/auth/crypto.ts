import crypto from 'crypto';
import { env } from '$env/dynamic/private';

const ALGORITHM = 'aes-256-gcm';
// This ensures your key is the correct length for AES-256
const SECRET_KEY = crypto
  .createHash('sha256')
  .update(String(env.DATABASE_ENCRYPTION_KEY))
  .digest('base64')
  .substring(0, 32);

export function decrypt(text: string) {
  try {
    const [ivHex, authTagHex, encryptedHex] = text.split(':');

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    decipher.setAuthTag(authTag);

    const decryptedBuffer = Buffer.concat([
      decipher.update(encryptedText),
      decipher.final()
    ]);

    return decryptedBuffer.toString('utf8');
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Could not decrypt cloud credentials');
  }
}
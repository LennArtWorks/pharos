import crypto from 'crypto';

// FIXED: Use standard Node process.env instead of SvelteKit's virtual $env.
// This allows both SvelteKit and server.js to use this file.
const rawKey = process.env.DATABASE_ENCRYPTION_KEY;

if (!rawKey) {
  console.warn("WARNING: DATABASE_ENCRYPTION_KEY is not set in environment!");
}

const ALGORITHM = 'aes-256-gcm';

// This ensures your key is the correct length for AES-256
const SECRET_KEY = crypto
  .createHash('sha256')
  .update(String(rawKey))
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

export function encrypt(text: string): string {
  try {
    // Generate a new random Initialization Vector for every encryption
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);

    const encryptedBuffer = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final()
    ]);

    // The Auth Tag ensures the encrypted data hasn't been tampered with
    const authTag = cipher.getAuthTag();

    // Return in the exact same format your decrypt function expects
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encryptedBuffer.toString('hex')}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Could not encrypt secure payload');
  }
}
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = crypto
  .createHash('sha256')
  .update(process.env.APP_SECRET || process.env.NEXTAUTH_SECRET || process.env.MONGODB_URI || 'wehosthere-external-account-key-secure-2026')
  .digest(); // 32 bytes

/**
 * Encrypt a plain-text password for secure storage
 */
export function encryptPassword(text: string): string {
  if (!text) return '';
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  } catch (err) {
    console.error('[Encryption] Failed to encrypt:', err);
    return text;
  }
}

/**
 * Decrypt an encrypted password
 */
export function decryptPassword(cipherText: string): string {
  if (!cipherText) return '';
  try {
    const parts = cipherText.split(':');
    if (parts.length !== 3) {
      // Return as-is if unencrypted or legacy
      return cipherText;
    }
    const [ivHex, tagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('[Encryption] Failed to decrypt:', error);
    return '';
  }
}

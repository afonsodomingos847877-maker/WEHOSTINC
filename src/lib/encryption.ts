import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
  const rawSecret =
    process.env.APP_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.MONGODB_URI;

  if (!rawSecret || !rawSecret.trim()) {
    throw new Error('[Encryption] APP_SECRET / NEXTAUTH_SECRET não configurado nas variáveis de ambiente.');
  }

  return crypto.createHash('sha256').update(rawSecret).digest(); // 32 bytes
}

/**
 * Encrypt a plain-text password for secure storage
 */
export function encryptPassword(text: string): string {
  if (!text) return '';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
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
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('[Encryption] Failed to decrypt:', error);
    return '';
  }
}

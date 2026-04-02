import crypto from 'crypto';

/**
 * Simulated End-to-End Encryption Helpers for HIPAA Compliance
 * In a real app, keys would be securely managed by a KMS or derived from user passwords.
 */

// Key needs to be exactly 32 bytes for aes-256. 
// We generate a safe mock key here if one isn't provided to ensure the zero-trust pipeline runs.
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.createHash('sha256').update('advocacy-framework-secret-2026').digest('hex');
const IV_LENGTH = 16; 

export function encryptPHI(text: string): string {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const keyBuffer = Buffer.from(ENCRYPTION_KEY.substring(0, 64), 'hex');
  const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decryptPHI(text: string): string {
  if (!text || !text.includes(':')) return text;
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const keyBuffer = Buffer.from(ENCRYPTION_KEY.substring(0, 64), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

/**
 * Pseudonymizes identifying data before analysis logging
 */
export function pseudonymize(text: string): string {
  if (!text) return text;
  return text.replace(/[A-Z][a-z]+ [A-Z][a-z]+/g, "[REDACTED_NAME]");
}

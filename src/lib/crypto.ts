/**
 * AES-256-GCM encryption for sensitive data (e.g. CRM OAuth tokens).
 * Key must be 32 bytes (256 bits) - use a base64 or hex-encoded value in env.
 */
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getKey(): Buffer {
  const secret = process.env.CRM_ENCRYPTION_KEY ?? process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error(
      "CRM_ENCRYPTION_KEY or ENCRYPTION_KEY must be set for token encryption"
    );
  }
  // Accept 64-char hex or 44-char base64 as raw key; otherwise derive
  if (secret.length === 64 && /^[0-9a-fA-F]+$/.test(secret)) {
    return Buffer.from(secret, "hex");
  }
  try {
    const decoded = Buffer.from(secret, "base64");
    if (decoded.length === KEY_LENGTH) return decoded;
  } catch {
    /* pass */
  }
  // Legacy salt string — must stay fixed or existing encrypted tokens cannot be decrypted.
  return scryptSync(secret, "salesync-crm-salt", KEY_LENGTH);
}

/**
 * Encrypt plaintext. Returns base64 string: iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

/**
 * Decrypt base64 payload from encrypt().
 */
export function decrypt(encrypted: string): string {
  const key = getKey();
  const buf = Buffer.from(encrypted, "base64");
  if (buf.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error("Invalid encrypted payload");
  }
  const iv = buf.subarray(0, IV_LENGTH);
  const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);
  return decipher.update(ciphertext, undefined, "utf8") + decipher.final("utf8");
}

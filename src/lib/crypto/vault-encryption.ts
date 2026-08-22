/**
 * Vault Encryption — Client-side AES-256-GCM encryption/decryption
 * 
 * Files are encrypted BEFORE upload and decrypted AFTER download.
 * The encryption key is derived from the user's ID + a per-document salt.
 * The IV (initialization vector) is stored alongside the encrypted data.
 * 
 * Format: [12-byte IV] + [encrypted data + auth tag]
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits recommended for AES-GCM
const SALT_LENGTH = 16;

/**
 * Derive an encryption key from the user's ID and a salt.
 * Uses PBKDF2 for key derivation.
 */
async function deriveKey(userId: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(userId),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a file before uploading to vault.
 * Returns the encrypted blob and the salt (needed for decryption).
 */
export async function encryptFile(
  file: File,
  userId: string
): Promise<{ encryptedBlob: Blob; salt: string }> {
  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Derive key
  const key = await deriveKey(userId, salt);

  // Read file as ArrayBuffer
  const fileBuffer = await file.arrayBuffer();

  // Encrypt
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    fileBuffer
  );

  // Combine: [salt (16)] + [iv (12)] + [encrypted data]
  const combined = new Uint8Array(SALT_LENGTH + IV_LENGTH + encryptedBuffer.byteLength);
  combined.set(salt, 0);
  combined.set(iv, SALT_LENGTH);
  combined.set(new Uint8Array(encryptedBuffer), SALT_LENGTH + IV_LENGTH);

  return {
    encryptedBlob: new Blob([combined], { type: 'application/octet-stream' }),
    salt: bufferToBase64(salt),
  };
}

/**
 * Decrypt a file downloaded from vault.
 * The salt is embedded in the file header (first 16 bytes).
 */
export async function decryptFile(
  encryptedBuffer: ArrayBuffer,
  userId: string,
  originalMimeType: string
): Promise<Blob> {
  const data = new Uint8Array(encryptedBuffer);

  // Extract salt, IV, and ciphertext
  const salt = data.slice(0, SALT_LENGTH);
  const iv = data.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const ciphertext = data.slice(SALT_LENGTH + IV_LENGTH);

  // Derive key
  const key = await deriveKey(userId, salt);

  // Decrypt
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );

  return new Blob([decryptedBuffer], { type: originalMimeType || 'application/octet-stream' });
}

/**
 * Helper: Convert buffer to base64 string
 */
function bufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

/**
 * Check if Web Crypto is available (required for encryption)
 */
export function isCryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined';
}

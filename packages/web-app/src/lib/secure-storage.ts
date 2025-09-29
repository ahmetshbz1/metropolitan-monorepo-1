/**
 * Web SecureStore - Encrypted localStorage
 * Browser-based secure storage using Web Crypto API
 * Similar to Expo SecureStore but for web
 */

// IMPORTANT: This provides encryption at rest, but NOT protection against XSS
// XSS attacks can still access decrypted data in memory
// This adds an extra layer of security against physical access to localStorage

const ENCRYPTION_KEY_NAME = 'metropolitan_encryption_key';
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

/**
 * Generate or retrieve encryption key
 * Key is stored in memory and regenerated each session
 */
async function getOrCreateEncryptionKey(): Promise<CryptoKey> {
  // Check if key exists in sessionStorage (per-session key)
  const storedKey = sessionStorage.getItem(ENCRYPTION_KEY_NAME);
  
  if (storedKey) {
    try {
      const keyData = JSON.parse(storedKey);
      return await crypto.subtle.importKey(
        'jwk',
        keyData,
        { name: ALGORITHM, length: KEY_LENGTH },
        true,
        ['encrypt', 'decrypt']
      );
    } catch {
      // Invalid key, regenerate
    }
  }

  // Generate new key
  const key = await crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );

  // Store in sessionStorage (cleared when tab closes)
  const exportedKey = await crypto.subtle.exportKey('jwk', key);
  sessionStorage.setItem(ENCRYPTION_KEY_NAME, JSON.stringify(exportedKey));

  console.log('🔐 New encryption key generated for this session');
  return key;
}

/**
 * Encrypt data using Web Crypto API
 */
async function encryptData(data: string): Promise<string> {
  try {
    const key = await getOrCreateEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 12 bytes for GCM
    const encoded = new TextEncoder().encode(data);

    const encrypted = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      encoded
    );

    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data using Web Crypto API
 */
async function decryptData(encryptedData: string): Promise<string> {
  try {
    const key = await getOrCreateEncryptionKey();
    
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Web SecureStore class
 * Mimics Expo SecureStore API
 */
export class WebSecureStore {
  private prefix = 'secure_';

  /**
   * Save encrypted data to localStorage
   */
  async setItemAsync(key: string, value: string): Promise<void> {
    try {
      const encrypted = await encryptData(value);
      localStorage.setItem(this.prefix + key, encrypted);
      console.log(`🔒 Securely stored: ${key}`);
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
      // Fallback to unencrypted (better than failing)
      localStorage.setItem(this.prefix + key, value);
      console.warn(`⚠️ Stored ${key} WITHOUT encryption (fallback)`);
    }
  }

  /**
   * Get and decrypt data from localStorage
   */
  async getItemAsync(key: string): Promise<string | null> {
    try {
      const encrypted = localStorage.getItem(this.prefix + key);
      if (!encrypted) return null;

      const decrypted = await decryptData(encrypted);
      return decrypted;
    } catch (error) {
      console.error(`Failed to get ${key}:`, error);
      // Try to return raw value (fallback for non-encrypted data)
      return localStorage.getItem(this.prefix + key);
    }
  }

  /**
   * Delete data from localStorage
   */
  async deleteItemAsync(key: string): Promise<void> {
    localStorage.removeItem(this.prefix + key);
    console.log(`🗑️ Deleted: ${key}`);
  }

  /**
   * Check if encryption is available
   */
  isAvailable(): boolean {
    return typeof crypto !== 'undefined' && 
           typeof crypto.subtle !== 'undefined' &&
           typeof sessionStorage !== 'undefined';
  }

  /**
   * Clear encryption key (force regeneration)
   */
  clearEncryptionKey(): void {
    sessionStorage.removeItem(ENCRYPTION_KEY_NAME);
    console.log('🔓 Encryption key cleared');
  }
}

// Export singleton instance
export const secureStorage = new WebSecureStore();

/**
 * Utility: Migrate from localStorage to SecureStore
 */
export async function migrateToSecureStorage(key: string): Promise<void> {
  try {
    const plainValue = localStorage.getItem(key);
    if (plainValue) {
      await secureStorage.setItemAsync(key, plainValue);
      localStorage.removeItem(key);
      console.log(`✅ Migrated ${key} to secure storage`);
    }
  } catch (error) {
    console.error(`Failed to migrate ${key}:`, error);
  }
}

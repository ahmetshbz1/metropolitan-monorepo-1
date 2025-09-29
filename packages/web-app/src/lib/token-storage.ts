// Token Storage for Web App - SecureStore v2 Integration
// Encrypted token management using crypto-js AES-256
// Based on mobile-app's token storage but with encryption

import {
  clearSessionId,
  extractSessionIdFromToken,
  saveSessionId,
} from "./device-fingerprint";
import { deviceIdStorage, syncDeviceIdFromToken } from "./device-id";
import { secureStorage } from "./secure-storage-v2";

export class TokenStorage {
  private readonly ACCESS_TOKEN_KEY = "access_token";
  private readonly REFRESH_TOKEN_KEY = "refresh_token";

  /**
   * Save access token with AES-256 encryption and sync device ID + session ID from JWT
   */
  async saveAccessToken(token: string): Promise<void> {
    try {
      // Save encrypted token using SecureStore v2
      await secureStorage.setItemAsync(this.ACCESS_TOKEN_KEY, token);
      console.log("🔒 Access token encrypted and stored");

      // Sync device ID from token (for Redis session matching)
      const deviceId = await syncDeviceIdFromToken(token);
      if (deviceId) {
        console.log("📱 Device ID synced from token:", deviceId);
      }

      // Sync session ID from token (CRITICAL: Must match Redis session)
      const sessionId = extractSessionIdFromToken(token);
      if (sessionId) {
        saveSessionId(sessionId);
        console.log("📋 Session ID synced from token:", sessionId);
      } else {
        console.warn("⚠️ No session ID in token");
      }
    } catch (error) {
      console.error("Failed to save access token:", error);
    }
  }

  /**
   * Save refresh token with AES-256 encryption
   */
  async saveRefreshToken(token: string): Promise<void> {
    try {
      await secureStorage.setItemAsync(this.REFRESH_TOKEN_KEY, token);
      console.log("🔒 Refresh token encrypted and stored");
    } catch (error) {
      console.error("Failed to save refresh token:", error);
    }
  }

  /**
   * Save both tokens
   */
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      this.saveAccessToken(accessToken),
      this.saveRefreshToken(refreshToken),
    ]);
  }

  /**
   * Get and decrypt access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const token = await secureStorage.getItemAsync(this.ACCESS_TOKEN_KEY);

      // Migration fallback: Check old plain localStorage
      if (!token) {
        const plainToken = localStorage.getItem("metropolitan_access_token");
        if (plainToken) {
          console.log("🔄 Migrating access token to encrypted storage");
          await this.saveAccessToken(plainToken);
          localStorage.removeItem("metropolitan_access_token");
          return plainToken;
        }
      }

      return token;
    } catch (error) {
      console.error("Failed to get access token:", error);
      return null;
    }
  }

  /**
   * Get and decrypt refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      const token = await secureStorage.getItemAsync(this.REFRESH_TOKEN_KEY);

      // Migration fallback: Check old plain localStorage
      if (!token) {
        const plainToken = localStorage.getItem("metropolitan_refresh_token");
        if (plainToken) {
          console.log("🔄 Migrating refresh token to encrypted storage");
          await this.saveRefreshToken(plainToken);
          localStorage.removeItem("metropolitan_refresh_token");
          return plainToken;
        }
      }

      return token;
    } catch (error) {
      console.error("Failed to get refresh token:", error);
      return null;
    }
  }

  /**
   * Check if tokens exist
   */
  async hasTokens(): Promise<boolean> {
    const [accessToken, refreshToken] = await Promise.all([
      this.getAccessToken(),
      this.getRefreshToken(),
    ]);
    return !!(accessToken && refreshToken);
  }

  /**
   * Clear all encrypted tokens, device ID, and session ID
   */
  async remove(): Promise<void> {
    try {
      // Clear encrypted tokens from SecureStore
      await secureStorage.deleteItemAsync(this.ACCESS_TOKEN_KEY);
      await secureStorage.deleteItemAsync(this.REFRESH_TOKEN_KEY);

      // Also clear old plain localStorage tokens (migration cleanup)
      localStorage.removeItem("metropolitan_access_token");
      localStorage.removeItem("metropolitan_refresh_token");

      // Always clear device ID on logout (to force new session on next login)
      const currentDeviceId = await deviceIdStorage.get();
      if (currentDeviceId) {
        console.log("🧹 Clearing device ID:", currentDeviceId);
        await deviceIdStorage.clear();
      }

      // Clear session ID (prevents Redis session mismatch)
      clearSessionId();

      // Clear encryption salt (force new encryption for next user)
      secureStorage.clearEncryptionSalt();

      console.log(
        "✅ All encrypted tokens, device ID, session ID, and encryption salt cleared"
      );
    } catch (error) {
      console.error("Failed to remove tokens:", error);
    }
  }

  /**
   * Clear all tokens (alias for remove)
   */
  async clearTokens(): Promise<void> {
    await this.remove();
  }
}

// Export singleton instance
export const tokenStorage = new TokenStorage();

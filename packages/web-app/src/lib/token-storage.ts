// Token Storage for Web App
// Browser localStorage based token management
// Based on mobile-app's token storage but adapted for web

import { deviceIdStorage, syncDeviceIdFromToken } from "./device-id";
import { extractSessionIdFromToken, saveSessionId, clearSessionId } from "./device-fingerprint";

export class TokenStorage {
  private readonly ACCESS_TOKEN_KEY = "metropolitan_access_token";
  private readonly REFRESH_TOKEN_KEY = "metropolitan_refresh_token";

  /**
   * Save access token and sync device ID + session ID from JWT
   */
  async saveAccessToken(token: string): Promise<void> {
    try {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, token);

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
   * Save refresh token
   */
  async saveRefreshToken(token: string): Promise<void> {
    try {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
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
   * Get access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error("Failed to get access token:", error);
      return null;
    }
  }

  /**
   * Get refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
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
   * Clear all tokens, device ID, and session ID
   */
  async remove(): Promise<void> {
    try {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);

      // Always clear device ID on logout (to force new session on next login)
      const currentDeviceId = await deviceIdStorage.get();
      if (currentDeviceId) {
        console.log("🧹 Clearing device ID:", currentDeviceId);
        await deviceIdStorage.clear();
      }

      // Clear session ID (prevents Redis session mismatch)
      clearSessionId();

      console.log("✅ All tokens, device ID, and session ID cleared");
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

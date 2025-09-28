// Token Storage for Web App
// Browser localStorage based token management
// Based on mobile-app's token storage but adapted for web

import {
  deviceIdStorage,
  isServerGeneratedDeviceId,
  syncDeviceIdFromToken,
} from './device-id';

export class TokenStorage {
  private readonly ACCESS_TOKEN_KEY = 'metropolitan_access_token';
  private readonly REFRESH_TOKEN_KEY = 'metropolitan_refresh_token';

  /**
   * Save access token
   */
  async saveAccessToken(token: string): Promise<void> {
    try {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
      await syncDeviceIdFromToken(token);
    } catch (error) {
      console.error('Failed to save access token:', error);
    }
  }

  /**
   * Save refresh token
   */
  async saveRefreshToken(token: string): Promise<void> {
    try {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to save refresh token:', error);
    }
  }

  /**
   * Save both tokens
   */
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      this.saveAccessToken(accessToken),
      this.saveRefreshToken(refreshToken)
    ]);
  }

  /**
   * Get access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get access token:', error);
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
      console.error('Failed to get refresh token:', error);
      return null;
    }
  }

  /**
   * Check if tokens exist
   */
  async hasTokens(): Promise<boolean> {
    const [accessToken, refreshToken] = await Promise.all([
      this.getAccessToken(),
      this.getRefreshToken()
    ]);
    return !!(accessToken && refreshToken);
  }

  /**
   * Clear all tokens
   */
  async remove(): Promise<void> {
    try {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      const currentDeviceId = await deviceIdStorage.get();
      if (currentDeviceId && !isServerGeneratedDeviceId(currentDeviceId)) {
        await deviceIdStorage.clear();
      }
    } catch (error) {
      console.error('Failed to remove tokens:', error);
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

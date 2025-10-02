//  "storage.ts"
//  metropolitan app
//  Created by Ahmet on 11.07.2025.

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { MobileUser } from "./types";

// Storage anahtarları
const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  AUTH_TOKEN: "auth_token", // Backwards compatibility
  USER_DATA: "user_data",
  GUEST_ID: "guest_id",
  IS_GUEST: "is_guest",
  SOCIAL_AUTH_DATA: "social_auth_data",
  APP_VERSION: "app_version", // Track app version for session management
} as const;

// Enhanced token storage with access/refresh token support
export const tokenStorage = {
  // Access token methods
  async saveAccessToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, token);
  },

  async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
  },

  async removeAccessToken(): Promise<void> {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
  },

  // Refresh token methods
  async saveRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
  },

  async removeRefreshToken(): Promise<void> {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
  },

  // Save both tokens
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      this.saveAccessToken(accessToken),
      this.saveRefreshToken(refreshToken),
    ]);
  },

  // Legacy methods for backward compatibility
  async save(token: string): Promise<void> {
    await this.saveAccessToken(token);
  },

  async get(): Promise<string | null> {
    // Try access token first, then fall back to legacy token
    const accessToken = await this.getAccessToken();
    if (accessToken) return accessToken;

    return await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
  },

  async remove(): Promise<void> {
    await Promise.all([
      this.removeAccessToken(),
      this.removeRefreshToken(),
      SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN),
    ]);
  },
};

// Kullanıcı verisi işlemleri
export const userStorage = {
  async save(user: MobileUser): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  },

  async get(): Promise<MobileUser | null> {
    const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  },

  async remove(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  },
};

// Misafir kullanıcı işlemleri
export const guestStorage = {
  async saveGuestId(guestId: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.GUEST_ID, guestId);
    await AsyncStorage.setItem(STORAGE_KEYS.IS_GUEST, "true");
  },

  async getGuestId(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.GUEST_ID);
  },

  async isGuest(): Promise<boolean> {
    const isGuest = await AsyncStorage.getItem(STORAGE_KEYS.IS_GUEST);
    return isGuest === "true";
  },

  async clearGuest(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.GUEST_ID);
    await AsyncStorage.removeItem(STORAGE_KEYS.IS_GUEST);
  },
};

// Social auth data operations
export const socialAuthStorage = {
  async save(data: any): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.SOCIAL_AUTH_DATA, JSON.stringify(data));
  },

  async get(): Promise<any | null> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SOCIAL_AUTH_DATA);
    return data ? JSON.parse(data) : null;
  },

  async remove(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.SOCIAL_AUTH_DATA);
  },
};

// Tüm auth verilerini temizle
export const clearAllAuthData = async (keepGuest: boolean = false): Promise<void> => {
  try {
    const operations = [
      tokenStorage.remove(),
      userStorage.remove(),
      socialAuthStorage.remove(),
    ];

    // Guest ID'yi sadece istenirse temizle
    if (!keepGuest) {
      operations.push(guestStorage.clearGuest());
    }

    await Promise.all(operations);
  } catch (error) {
    // Removed console statement
  }
};

// App version management for session cleanup
export const versionStorage = {
  async saveCurrentVersion(version: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.APP_VERSION, version);
  },

  async getStoredVersion(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.APP_VERSION);
  },

  async checkVersionChanged(currentVersion: string): Promise<boolean> {
    const storedVersion = await this.getStoredVersion();
    return storedVersion !== null && storedVersion !== currentVersion;
  },
};

// Auth durumunu yükle
export const loadAuthState = async () => {
  try {
    const [token, refreshToken, user, guestId, isGuestFlag, socialAuthData] = await Promise.all([
      tokenStorage.get(),
      tokenStorage.getRefreshToken(),
      userStorage.get(),
      guestStorage.getGuestId(),
      guestStorage.isGuest(),
      socialAuthStorage.get(),
    ]);

    console.log("🔧 [AUTH DEBUG] Loaded auth state:", {
      hasToken: !!token,
      hasRefreshToken: !!refreshToken,
      hasUser: !!user,
      userPhone: user?.phone,
      userType: user?.userType,
      isGuest: isGuestFlag,
      guestId,
      hasSocialAuth: !!socialAuthData,
    });

    return {
      token,
      refreshToken,
      user,
      guestId,
      isGuest: isGuestFlag,
      socialAuthData,
    };
  } catch (error) {
    console.log("🔧 [AUTH DEBUG] Error loading auth state:", error);
    return {
      token: null,
      refreshToken: null,
      user: null,
      guestId: null,
      isGuest: false,
      socialAuthData: null,
    };
  }
};

//  "storage.ts"
//  metropolitan app
//  Created by Ahmet on 11.07.2025.

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { User } from "./types";

// Storage anahtarları
const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  AUTH_TOKEN: "auth_token", // Backwards compatibility
  USER_DATA: "user_data",
  GUEST_ID: "guest_id",
  IS_GUEST: "is_guest",
  SOCIAL_AUTH_DATA: "social_auth_data",
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
  async save(user: User): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  },

  async get(): Promise<User | null> {
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
export const clearAllAuthData = async (): Promise<void> => {
  try {
    await Promise.all([
      tokenStorage.remove(),
      userStorage.remove(),
      guestStorage.clearGuest(),
      socialAuthStorage.remove(),
    ]);
  } catch (error) {
    console.error("Auth verilerini temizlerken hata oluştu:", error);
  }
};

// Auth durumunu yükle
export const loadAuthState = async () => {
  try {
    const [token, user, guestId, isGuestFlag, socialAuthData] = await Promise.all([
      tokenStorage.get(),
      userStorage.get(),
      guestStorage.getGuestId(),
      guestStorage.isGuest(),
      socialAuthStorage.get(),
    ]);

    return {
      token,
      user,
      guestId,
      isGuest: isGuestFlag,
      socialAuthData,
    };
  } catch (error) {
    console.error("Auth durumu yüklenirken hata oluştu:", error);
    return {
      token: null,
      user: null,
      guestId: null,
      isGuest: false,
      socialAuthData: null,
    };
  }
};

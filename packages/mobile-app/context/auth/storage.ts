//  "storage.ts"
//  metropolitan app
//  Created by Ahmet on 11.07.2025.

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { User } from "./types";

// Storage anahtarları
const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  USER_DATA: "user_data",
  GUEST_ID: "guest_id",
  IS_GUEST: "is_guest",
} as const;

// Token işlemleri
export const tokenStorage = {
  async save(token: string): Promise<void> {
    await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
  },

  async get(): Promise<string | null> {
    return await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
  },

  async remove(): Promise<void> {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
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

// Tüm auth verilerini temizle
export const clearAllAuthData = async (): Promise<void> => {
  try {
    await Promise.all([
      tokenStorage.remove(),
      userStorage.remove(),
      guestStorage.clearGuest(),
    ]);
  } catch (error) {
    console.error("Auth verilerini temizlerken hata oluştu:", error);
  }
};

// Auth durumunu yükle
export const loadAuthState = async () => {
  try {
    const [token, user, guestId, isGuestFlag] = await Promise.all([
      tokenStorage.get(),
      userStorage.get(),
      guestStorage.getGuestId(),
      guestStorage.isGuest(),
    ]);

    return {
      token,
      user,
      guestId,
      isGuest: isGuestFlag,
    };
  } catch (error) {
    console.error("Auth durumu yüklenirken hata oluştu:", error);
    return {
      token: null,
      user: null,
      guestId: null,
      isGuest: false,
    };
  }
};

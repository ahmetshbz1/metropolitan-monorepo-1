//  "storage.ts"
//  metropolitan app
//  Created by Ahmet on 28.07.2025.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateStorage } from 'zustand/middleware';

// Custom storage adapter for React Native AsyncStorage
export const createAsyncStorageAdapter = (): StateStorage => ({
  getItem: async (name: string): Promise<string | null> => {
    try {
      const value = await AsyncStorage.getItem(name);
      return value;
    } catch (error) {
      console.error(`Error reading from AsyncStorage:`, error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(name, value);
    } catch (error) {
      console.error(`Error writing to AsyncStorage:`, error);
      throw error;
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(name);
    } catch (error) {
      console.error(`Error removing from AsyncStorage:`, error);
      throw error;
    }
  },
});

// Storage key prefix for all stores
export const STORAGE_PREFIX = '@metropolitan:';

// Storage keys for different stores
export const StorageKeys = {
  AUTH: `${STORAGE_PREFIX}auth`,
  CART: `${STORAGE_PREFIX}cart`,
  FAVORITES: `${STORAGE_PREFIX}favorites`,
  USER_SETTINGS: `${STORAGE_PREFIX}settings`,
  OFFLINE_QUEUE: `${STORAGE_PREFIX}offline_queue`,
} as const;

// Helper to clear all app storage
export const clearAllStorage = async () => {
  const keys = await AsyncStorage.getAllKeys();
  const appKeys = keys.filter(key => key.startsWith(STORAGE_PREFIX));
  await AsyncStorage.multiRemove(appKeys);
};
//  "authSlice.ts"
//  metropolitan app
//  Created by Claude on 28.07.2025.

import { StateCreator } from 'zustand';
import { EcommerceStore, AuthSlice } from '../types';
import { handleApiError, generateTempId, storeData, removeData } from '../utils';
import api from '@/core/api';
import * as SecureStore from 'expo-secure-store';

const SECURE_STORE_KEYS = {
  TOKEN: 'auth_token',
  REGISTRATION_TOKEN: 'registration_token',
  GUEST_ID: 'guest_id',
} as const;

export const createAuthSlice: StateCreator<
  EcommerceStore,
  [],
  [],
  AuthSlice & {
    sendOTP: (phoneNumber: string) => Promise<{ success: boolean; message: string }>;
    verifyOTP: (otp: string) => Promise<{ success: boolean; message: string; isNewUser: boolean }>;
    completeProfile: (userData: any) => Promise<{ success: boolean; message: string }>;
    updateUserProfile: (userData: any) => Promise<{ success: boolean; message: string }>;
    uploadProfilePhoto: (uri: string) => Promise<{ success: boolean; message: string }>;
    refreshUserProfile: () => Promise<void>;
    loginAsGuest: () => Promise<void>;
    logout: () => void;
  }
> = (set, get) => ({
  // Auth state
  user: null,
  token: null,
  registrationToken: null,
  isGuest: false,
  guestId: null,
  phoneNumber: null,
  isAuthenticated: false,
  loading: true,
  error: null,

  // Send OTP action
  sendOTP: async (phoneNumber: string) => {
    set({ loading: true, error: null, phoneNumber });
    
    try {
      const response = await api.post('/auth/send-otp', { phoneNumber });
      
      set({ loading: false });
      return { success: true, message: 'OTP gönderildi' };
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({ loading: false, error: errorMessage });
      return { success: false, message: errorMessage };
    }
  },

  // Verify OTP action
  verifyOTP: async (otp: string) => {
    const { phoneNumber } = get();
    if (!phoneNumber) {
      return { success: false, message: 'Telefon numarası bulunamadı', isNewUser: false };
    }

    set({ loading: true, error: null });

    try {
      const response = await api.post('/auth/verify-otp', { phoneNumber, otp });
      const { token, registrationToken, user, isNewUser } = response.data;

      if (isNewUser) {
        // Store registration token for profile completion
        await SecureStore.setItemAsync(SECURE_STORE_KEYS.REGISTRATION_TOKEN, registrationToken);
        set({ 
          registrationToken, 
          loading: false,
          error: null 
        });
        return { success: true, message: 'OTP doğrulandı', isNewUser: true };
      } else {
        // Existing user - complete login
        await SecureStore.setItemAsync(SECURE_STORE_KEYS.TOKEN, token);
        
        set({
          user,
          token,
          isAuthenticated: true,
          isGuest: false,
          loading: false,
          error: null,
        });

        // Migrate guest cart if exists
        const { guestId } = get();
        if (guestId && user?.id) {
          get().migrateGuestCart(user.id);
        }

        return { success: true, message: 'Giriş başarılı', isNewUser: false };
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({ loading: false, error: errorMessage });
      return { success: false, message: errorMessage, isNewUser: false };
    }
  },

  // Complete profile action
  completeProfile: async (userData: any) => {
    const { registrationToken } = get();
    if (!registrationToken) {
      return { success: false, message: 'Kayıt token\'ı bulunamadı' };
    }

    set({ loading: true, error: null });

    try {
      const response = await api.post('/auth/complete-profile', {
        ...userData,
        registrationToken,
      });

      const { token, user } = response.data;

      // Store token and clear registration token
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.TOKEN, token);
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REGISTRATION_TOKEN);

      set({
        user,
        token,
        registrationToken: null,
        isAuthenticated: true,
        isGuest: false,
        loading: false,
        error: null,
      });

      // Migrate guest cart if exists
      const { guestId } = get();
      if (guestId && user?.id) {
        get().migrateGuestCart(user.id);
      }

      return { success: true, message: 'Profil tamamlandı' };
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({ loading: false, error: errorMessage });
      return { success: false, message: errorMessage };
    }
  },

  // Update user profile action
  updateUserProfile: async (userData: any) => {
    const { token } = get();
    if (!token) {
      return { success: false, message: 'Yetkilendirme token\'ı bulunamadı' };
    }

    set({ loading: true, error: null });

    try {
      const response = await api.put('/auth/profile', userData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { user } = response.data;
      
      set({ 
        user, 
        loading: false,
        error: null 
      });

      return { success: true, message: 'Profil güncellendi' };
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({ loading: false, error: errorMessage });
      return { success: false, message: errorMessage };
    }
  },

  // Upload profile photo action
  uploadProfilePhoto: async (uri: string) => {
    const { token } = get();
    if (!token) {
      return { success: false, message: 'Yetkilendirme token\'ı bulunamadı' };
    }

    set({ loading: true, error: null });

    try {
      const formData = new FormData();
      formData.append('photo', {
        uri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any);

      const response = await api.post('/auth/upload-photo', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const { user } = response.data;
      
      set({ 
        user, 
        loading: false,
        error: null 
      });

      return { success: true, message: 'Fotoğraf yüklendi' };
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({ loading: false, error: errorMessage });
      return { success: false, message: errorMessage };
    }
  },

  // Refresh user profile action
  refreshUserProfile: async () => {
    const { token } = get();
    if (!token) return;

    try {
      const response = await api.get('/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { user } = response.data;
      set({ user, error: null });
    } catch (error) {
      console.warn('Failed to refresh user profile:', error);
      // Don't set error for background refresh
    }
  },

  // Login as guest action
  loginAsGuest: async () => {
    const existingGuestId = await SecureStore.getItemAsync(SECURE_STORE_KEYS.GUEST_ID);
    const guestId = existingGuestId || generateTempId();

    if (!existingGuestId) {
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.GUEST_ID, guestId);
    }

    set({
      isGuest: true,
      guestId,
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
      error: null,
    });
  },

  // Logout action
  logout: () => {
    // Clear secure storage
    SecureStore.deleteItemAsync(SECURE_STORE_KEYS.TOKEN);
    SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REGISTRATION_TOKEN);
    SecureStore.deleteItemAsync(SECURE_STORE_KEYS.GUEST_ID);

    // Clear other stored data
    removeData('checkout_progress');
    removeData('cart_backup');

    // Reset auth state
    set({
      user: null,
      token: null,
      registrationToken: null,
      isGuest: false,
      guestId: null,
      phoneNumber: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });

    // Clear cart and checkout
    get().clearCart();
    get().resetCheckout();
  },
});
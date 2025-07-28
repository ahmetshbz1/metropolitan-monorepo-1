//  "store.ts"
//  metropolitan app
//  Created by Ahmet on 28.07.2025.

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { createStore } from '../shared/middleware';
import { StorageKeys } from '../shared/storage';
import { AuthStore } from './types';
import { createOTPActions } from './actions/otp-flow';
import { createSessionActions } from './actions/session';
import { createProfileActions } from './actions/profile';

// Initial state
const initialState: Omit<AuthStore, keyof any> = {
  // User data
  user: null,
  token: null,
  registrationToken: null,
  
  // Session state
  isGuest: false,
  guestId: null,
  phoneNumber: null,
  
  // Loading states
  isLoading: true,
  error: null,
  isSendingOTP: false,
  isVerifyingOTP: false,
  isCompletingProfile: false,
  isUpdatingProfile: false,
  isUploadingPhoto: false,
  
  // Session management
  lastActivity: null,
  tokenExpiresAt: null,
  refreshTokenAttempts: 0,
  
  // Placeholder actions (will be overridden)
  sendOTP: async () => ({ success: false, message: 'Not implemented' }),
  verifyOTP: async () => ({ success: false, message: 'Not implemented', isNewUser: false }),
  completeProfile: async () => ({ success: false, message: 'Not implemented' }),
  updateUserProfile: async () => ({ success: false, message: 'Not implemented' }),
  uploadProfilePhoto: async () => ({ success: false, message: 'Not implemented' }),
  refreshUserProfile: async () => {},
  loginAsGuest: async () => {},
  logout: () => {},
  refreshToken: async () => false,
  setUser: () => {},
  setToken: () => {},
  setRegistrationToken: () => {},
  setGuestId: () => {},
  setPhoneNumber: () => {},
  setLoading: () => {},
  setError: () => {},
  updateLastActivity: () => {},
  setTokenExpiry: () => {},
  incrementRefreshAttempts: () => {},
  resetRefreshAttempts: () => {},
};

// Create auth store
export const useAuthStore = create<AuthStore>()(
  subscribeWithSelector(
    createStore(
      'auth',
      (set, get) => {
        // Create action functions
        const otpActions = createOTPActions(get, set);
        const sessionActions = createSessionActions(get, set);
        const profileActions = createProfileActions(get, set);
        
        return {
          ...initialState,
          
          // OTP flow actions
          sendOTP: otpActions.sendOTP,
          verifyOTP: otpActions.verifyOTP,
          completeProfile: otpActions.completeProfile,
          
          // Profile actions
          updateUserProfile: profileActions.updateUserProfile,
          uploadProfilePhoto: profileActions.uploadProfilePhoto,
          refreshUserProfile: profileActions.refreshUserProfile,
          
          // Session actions
          loginAsGuest: sessionActions.loginAsGuest,
          logout: sessionActions.logout,
          refreshToken: sessionActions.refreshToken,
          updateLastActivity: sessionActions.updateLastActivity,
          setTokenExpiry: sessionActions.setTokenExpiry,
          incrementRefreshAttempts: sessionActions.incrementRefreshAttempts,
          resetRefreshAttempts: sessionActions.resetRefreshAttempts,
          
          // State setters
          setUser: (user) => set({ user }),
          setToken: (token) => set({ token }),
          setRegistrationToken: (registrationToken) => set({ registrationToken }),
          setGuestId: (guestId) => set({ guestId }),
          setPhoneNumber: (phoneNumber) => set({ phoneNumber }),
          setLoading: (isLoading) => set({ isLoading }),
          setError: (error) => set({ error }),
        };
      },
      {
        key: StorageKeys.AUTH,
        version: 1,
        migrate: (persistedState: any, version: number) => {
          // Handle migration between versions
          if (version === 0) {
            // Migration from version 0 to 1
            return {
              ...persistedState,
              refreshTokenAttempts: 0,
              lastActivity: null,
              tokenExpiresAt: null,
            };
          }
          return persistedState;
        },
      }
    )
  )
);

// Auto-refresh token setup
let tokenRefreshInterval: NodeJS.Timeout | null = null;

// Subscribe to token changes to setup auto-refresh
useAuthStore.subscribe(
  (state) => state.token,
  (token) => {
    // Clear existing interval
    if (tokenRefreshInterval) {
      clearInterval(tokenRefreshInterval);
      tokenRefreshInterval = null;
    }
    
    // Setup new interval if token exists
    if (token) {
      tokenRefreshInterval = setInterval(async () => {
        const state = useAuthStore.getState();
        
        if (state.shouldRefreshToken() && state.refreshTokenAttempts < 3) {
          await state.refreshToken();
        }
      }, 60000); // Check every minute
    }
  }
);
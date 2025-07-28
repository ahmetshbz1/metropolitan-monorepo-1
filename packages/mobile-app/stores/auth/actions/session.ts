//  "session.ts"
//  metropolitan app
//  Created by Ahmet on 28.07.2025.

import { AuthService } from '@/services/authService';
import { clearAllStorage } from '../../shared/storage';
import { AuthStore } from '../types';
import { nanoid } from 'nanoid/non-secure';

export const createSessionActions = (
  get: () => AuthStore,
  set: (partial: Partial<AuthStore>) => void
) => {
  // Login as guest user
  const loginAsGuest = async () => {
    const state = get();
    
    if (state.isLoading) {
      return;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      // Generate guest ID
      const guestId = `guest_${nanoid()}`;
      
      // Clear any existing user data
      set({
        user: null,
        token: null,
        registrationToken: null,
        isGuest: true,
        guestId,
        phoneNumber: null,
        lastActivity: Date.now(),
        tokenExpiresAt: null,
        refreshTokenAttempts: 0,
        isLoading: false,
      });
      
    } catch (error) {
      console.error('Failed to create guest session:', error);
      
      set({
        isLoading: false,
        error: 'Failed to create guest session',
      });
    }
  };
  
  // Logout user
  const logout = () => {
    const state = get();
    
    // Notify backend if user was authenticated
    if (state.token) {
      AuthService.logout().catch(error => {
        console.error('Failed to notify backend of logout:', error);
      });
    }
    
    // Clear all auth state
    set({
      user: null,
      token: null,
      registrationToken: null,
      isGuest: false,
      guestId: null,
      phoneNumber: null,
      lastActivity: null,
      tokenExpiresAt: null,
      refreshTokenAttempts: 0,
      error: null,
      isLoading: false,
      
      // Reset loading states
      isSendingOTP: false,
      isVerifyingOTP: false,
      isCompletingProfile: false,
      isUpdatingProfile: false,
      isUploadingPhoto: false,
    });
    
    // Clear all app storage
    clearAllStorage().catch(error => {
      console.error('Failed to clear storage:', error);
    });
  };
  
  // Refresh auth token
  const refreshToken = async (): Promise<boolean> => {
    const state = get();
    
    if (!state.token || state.refreshTokenAttempts >= 3) {
      return false;
    }
    
    set({ 
      refreshTokenAttempts: state.refreshTokenAttempts + 1,
    });
    
    try {
      const response = await AuthService.refreshToken(state.token);
      
      const expiresAt = Date.now() + (response.expiresIn * 1000);
      
      set({
        token: response.token,
        user: response.user || state.user,
        tokenExpiresAt: expiresAt,
        lastActivity: Date.now(),
        refreshTokenAttempts: 0,
      });
      
      return true;
      
    } catch (error: any) {
      console.error('Failed to refresh token:', error);
      
      // If refresh fails, logout user
      if (error.response?.status === 401) {
        logout();
      }
      
      return false;
    }
  };
  
  // Update last activity timestamp
  const updateLastActivity = () => {
    set({ lastActivity: Date.now() });
  };
  
  // Set token expiry time
  const setTokenExpiry = (expiresAt: number) => {
    set({ tokenExpiresAt: expiresAt });
  };
  
  // Increment refresh token attempts
  const incrementRefreshAttempts = () => {
    const state = get();
    set({ refreshTokenAttempts: state.refreshTokenAttempts + 1 });
  };
  
  // Reset refresh token attempts
  const resetRefreshAttempts = () => {
    set({ refreshTokenAttempts: 0 });
  };
  
  // Check if token needs refresh
  const shouldRefreshToken = (): boolean => {
    const state = get();
    
    if (!state.token || !state.tokenExpiresAt) {
      return false;
    }
    
    // Refresh if token expires in less than 5 minutes
    const fiveMinutes = 5 * 60 * 1000;
    return (Date.now() + fiveMinutes) >= state.tokenExpiresAt;
  };
  
  // Auto-refresh token if needed
  const checkAndRefreshToken = async (): Promise<void> => {
    const state = get();
    
    if (shouldRefreshToken() && state.refreshTokenAttempts < 3) {
      await refreshToken();
    }
  };
  
  return {
    loginAsGuest,
    logout,
    refreshToken,
    updateLastActivity,
    setTokenExpiry,
    incrementRefreshAttempts,
    resetRefreshAttempts,
    shouldRefreshToken,
    checkAndRefreshToken,
  };
};
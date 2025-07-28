//  "hooks.ts"
//  metropolitan app
//  Created by Ahmet on 28.07.2025.

import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuthStore } from './store';
import {
  selectUser,
  selectToken,
  selectIsGuest,
  selectGuestId,
  selectPhoneNumber,
  selectRegistrationToken,
  selectIsLoading,
  selectError,
  selectAuthStatus,
  selectOTPStatus,
  selectProfileUpdateStatus,
  selectSessionInfo,
  selectUserDisplayName,
  selectUserInitials,
} from './selectors';
import { shallow } from '../shared/selectors';

// Main auth hook - compatible with existing Context API
export const useAuth = () => {
  const store = useAuthStore();
  
  // Subscribe to specific slices to prevent unnecessary re-renders
  const user = useAuthStore(selectUser);
  const token = useAuthStore(selectToken);
  const registrationToken = useAuthStore(selectRegistrationToken);
  const isGuest = useAuthStore(selectIsGuest);
  const guestId = useAuthStore(selectGuestId);
  const phoneNumber = useAuthStore(selectPhoneNumber);
  const loading = useAuthStore(selectIsLoading);
  const authStatus = useAuthStore(selectAuthStatus, shallow);
  
  // Handle app state changes for session management
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // App became active, update activity and refresh profile
        store.updateLastActivity();
        
        if (token) {
          store.refreshUserProfile();
        }
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [store, token]);
  
  // Auto-logout on session expiry
  useEffect(() => {
    if (authStatus.isSessionExpired && token) {
      console.log('Session expired, logging out...');
      store.logout();
    }
  }, [authStatus.isSessionExpired, token, store]);
  
  return {
    user,
    token,
    registrationToken,
    isGuest,
    guestId,
    phoneNumber,
    loading,
    
    // Actions
    sendOTP: store.sendOTP,
    verifyOTP: store.verifyOTP,
    completeProfile: store.completeProfile,
    updateUserProfile: store.updateUserProfile,
    uploadProfilePhoto: store.uploadProfilePhoto,
    refreshUserProfile: store.refreshUserProfile,
    loginAsGuest: store.loginAsGuest,
    logout: store.logout,
    
    // Additional computed values
    isAuthenticated: authStatus.isAuthenticated,
    hasValidSession: authStatus.hasValidSession,
  };
};

// Hook for OTP flow status
export const useOTPStatus = () => {
  return useAuthStore(selectOTPStatus, shallow);
};

// Hook for profile update status
export const useProfileUpdateStatus = () => {
  return useAuthStore(selectProfileUpdateStatus, shallow);
};

// Hook for session information
export const useSessionInfo = () => {
  return useAuthStore(selectSessionInfo, shallow);
};

// Hook for user display information
export const useUserDisplay = () => {
  const displayName = useAuthStore(selectUserDisplayName);
  const initials = useAuthStore(selectUserInitials);
  const user = useAuthStore(selectUser);
  
  return {
    displayName,
    initials,
    profilePhotoUrl: user?.profilePhotoUrl,
    hasProfilePhoto: !!user?.profilePhotoUrl,
  };
};

// Hook for authentication state only
export const useAuthState = () => {
  return useAuthStore(
    useCallback(
      (state) => ({
        isAuthenticated: !!state.user && !!state.token,
        isGuest: state.isGuest,
        hasValidSession: (!!state.user && !!state.token) || (state.isGuest && !!state.guestId),
        isLoading: state.isLoading,
      }),
      []
    ),
    shallow
  );
};

// Hook for token management
export const useTokenManager = () => {
  const store = useAuthStore();
  
  const tokenInfo = useAuthStore(
    useCallback(
      (state) => ({
        hasToken: !!state.token,
        tokenExpiresAt: state.tokenExpiresAt,
        shouldRefresh: state.shouldRefreshToken(),
        refreshAttempts: state.refreshTokenAttempts,
      }),
      []
    ),
    shallow
  );
  
  return {
    ...tokenInfo,
    refreshToken: store.refreshToken,
    updateLastActivity: store.updateLastActivity,
  };
};

// Hook for guest session management
export const useGuestSession = () => {
  const store = useAuthStore();
  
  const guestInfo = useAuthStore(
    useCallback(
      (state) => ({
        isGuest: state.isGuest,
        guestId: state.guestId,
        hasGuestSession: state.isGuest && !!state.guestId,
      }),
      []
    ),
    shallow
  );
  
  return {
    ...guestInfo,
    loginAsGuest: store.loginAsGuest,
    setGuestId: store.setGuestId,
  };
};

// Performance hook for monitoring auth renders
export const useAuthPerformance = () => {
  return useAuthStore(
    useCallback(
      (state) => ({
        hasUser: !!state.user,
        hasToken: !!state.token,
        isLoading: state.isLoading,
        hasError: !!state.error,
        isInOTPFlow: state.isSendingOTP || state.isVerifyingOTP,
        isUpdatingProfile: state.isUpdatingProfile || state.isCompletingProfile,
      }),
      []
    ),
    shallow
  );
};
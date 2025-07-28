//  "selectors.ts"
//  metropolitan app
//  Created by Ahmet on 28.07.2025.

import { AuthStore, AuthSelectors } from './types';
import { createSelector, createComputedSelector, shallow } from '../shared/selectors';

// Basic selectors
export const selectUser = (state: AuthStore) => state.user;
export const selectToken = (state: AuthStore) => state.token;
export const selectIsGuest = (state: AuthStore) => state.isGuest;
export const selectGuestId = (state: AuthStore) => state.guestId;
export const selectPhoneNumber = (state: AuthStore) => state.phoneNumber;
export const selectRegistrationToken = (state: AuthStore) => state.registrationToken;
export const selectIsLoading = (state: AuthStore) => state.isLoading;
export const selectError = (state: AuthStore) => state.error;

// Loading state selectors
export const selectIsSendingOTP = (state: AuthStore) => state.isSendingOTP;
export const selectIsVerifyingOTP = (state: AuthStore) => state.isVerifyingOTP;
export const selectIsCompletingProfile = (state: AuthStore) => state.isCompletingProfile;
export const selectIsUpdatingProfile = (state: AuthStore) => state.isUpdatingProfile;
export const selectIsUploadingPhoto = (state: AuthStore) => state.isUploadingPhoto;

// Session selectors
export const selectLastActivity = (state: AuthStore) => state.lastActivity;
export const selectTokenExpiresAt = (state: AuthStore) => state.tokenExpiresAt;
export const selectRefreshTokenAttempts = (state: AuthStore) => state.refreshTokenAttempts;

// Computed selectors
export const selectIsAuthenticated = createSelector(
  (state: AuthStore) => !!state.user && !!state.token
);

export const selectHasValidSession = createSelector(
  (state: AuthStore) => 
    (!!state.user && !!state.token) || (state.isGuest && !!state.guestId)
);

export const selectIsSessionExpired = createSelector(
  (state: AuthStore) => {
    if (!state.tokenExpiresAt) return false;
    return Date.now() >= state.tokenExpiresAt;
  }
);

export const selectSessionType = createSelector(
  (state: AuthStore) => {
    if (state.user && state.token) return 'user';
    if (state.isGuest && state.guestId) return 'guest';
    return 'none';
  }
);

export const selectShouldRefreshToken = createSelector(
  (state: AuthStore) => {
    if (!state.token || !state.tokenExpiresAt) return false;
    
    // Refresh if token expires in less than 5 minutes
    const fiveMinutes = 5 * 60 * 1000;
    return (Date.now() + fiveMinutes) >= state.tokenExpiresAt;
  }
);

export const selectUserDisplayName = createSelector(
  (state: AuthStore) => {
    if (!state.user) return '';
    
    if (state.user.firstName && state.user.lastName) {
      return `${state.user.firstName} ${state.user.lastName}`;
    }
    
    if (state.user.firstName) {
      return state.user.firstName;
    }
    
    if (state.user.email) {
      return state.user.email;
    }
    
    if (state.phoneNumber) {
      return state.phoneNumber;
    }
    
    return 'User';
  }
);

export const selectUserInitials = createSelector(
  (state: AuthStore) => {
    if (!state.user) return '';
    
    if (state.user.firstName && state.user.lastName) {
      return `${state.user.firstName[0]}${state.user.lastName[0]}`.toUpperCase();
    }
    
    if (state.user.firstName) {
      return state.user.firstName[0].toUpperCase();
    }
    
    if (state.user.email) {
      return state.user.email[0].toUpperCase();
    }
    
    return 'U';
  }
);

// Complex computed selectors
export const selectAuthStatus = createComputedSelector(
  [
    selectIsAuthenticated,
    selectIsGuest,
    selectIsLoading,
    selectError,
    selectIsSessionExpired,
  ] as const,
  (isAuthenticated, isGuest, isLoading, error, isSessionExpired) => ({
    isAuthenticated,
    isGuest,
    isLoading,
    error,
    isSessionExpired,
    hasValidSession: isAuthenticated || isGuest,
    isReady: !isLoading && !error,
  }),
  shallow
);

export const selectOTPStatus = createComputedSelector(
  [
    selectIsSendingOTP,
    selectIsVerifyingOTP,
    selectPhoneNumber,
    selectRegistrationToken,
  ] as const,
  (isSendingOTP, isVerifyingOTP, phoneNumber, registrationToken) => ({
    isSendingOTP,
    isVerifyingOTP,
    phoneNumber,
    hasRegistrationToken: !!registrationToken,
    isInOTPFlow: !!phoneNumber,
  }),
  shallow
);

export const selectProfileUpdateStatus = createComputedSelector(
  [
    selectIsCompletingProfile,
    selectIsUpdatingProfile,
    selectIsUploadingPhoto,
  ] as const,
  (isCompletingProfile, isUpdatingProfile, isUploadingPhoto) => ({
    isCompletingProfile,
    isUpdatingProfile,
    isUploadingPhoto,
    isUpdating: isCompletingProfile || isUpdatingProfile || isUploadingPhoto,
  }),
  shallow
);

export const selectSessionInfo = createComputedSelector(
  [
    selectSessionType,
    selectLastActivity,
    selectTokenExpiresAt,
    selectShouldRefreshToken,
  ] as const,
  (sessionType, lastActivity, tokenExpiresAt, shouldRefreshToken) => ({
    sessionType,
    lastActivity,
    tokenExpiresAt,
    shouldRefreshToken,
    isActive: sessionType !== 'none',
    timeUntilExpiry: tokenExpiresAt ? Math.max(0, tokenExpiresAt - Date.now()) : null,
  }),
  shallow
);

// Factory function to create bound selectors
export const createAuthSelectors = (useStore: () => AuthStore): AuthSelectors => ({
  isAuthenticated: () => {
    const state = useStore();
    return selectIsAuthenticated(state);
  },
  
  hasValidSession: () => {
    const state = useStore();
    return selectHasValidSession(state);
  },
  
  isSessionExpired: () => {
    const state = useStore();
    return selectIsSessionExpired(state);
  },
  
  getSessionType: () => {
    const state = useStore();
    return selectSessionType(state);
  },
  
  shouldRefreshToken: () => {
    const state = useStore();
    return selectShouldRefreshToken(state);
  },
  
  getUserDisplayName: () => {
    const state = useStore();
    return selectUserDisplayName(state);
  },
  
  getUserInitials: () => {
    const state = useStore();
    return selectUserInitials(state);
  },
});
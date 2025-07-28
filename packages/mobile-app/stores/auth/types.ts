//  "types.ts"
//  metropolitan app
//  Created by Ahmet on 28.07.2025.

import { User } from '@metropolitan/shared';
import { AsyncState } from '../shared/types';

// Auth store state
export interface AuthState extends AsyncState {
  // User data
  user: User | null;
  token: string | null;
  registrationToken: string | null;
  
  // Session state
  isGuest: boolean;
  guestId: string | null;
  phoneNumber: string | null;
  
  // UI loading states
  isSendingOTP: boolean;
  isVerifyingOTP: boolean;
  isCompletingProfile: boolean;
  isUpdatingProfile: boolean;
  isUploadingPhoto: boolean;
  
  // Session management
  lastActivity: number | null;
  tokenExpiresAt: number | null;
  refreshTokenAttempts: number;
}

// Auth actions
export interface AuthActions {
  // OTP flow
  sendOTP: (phoneNumber: string) => Promise<{
    success: boolean;
    message: string;
  }>;
  
  verifyOTP: (phoneNumber: string, otp: string) => Promise<{
    success: boolean;
    message: string;
    isNewUser: boolean;
  }>;
  
  // Profile management
  completeProfile: (profileData: any) => Promise<{
    success: boolean;
    message: string;
  }>;
  
  updateUserProfile: (updates: Partial<User>) => Promise<{
    success: boolean;
    message: string;
  }>;
  
  uploadProfilePhoto: (photoUri: string) => Promise<{
    success: boolean;
    message: string;
  }>;
  
  refreshUserProfile: () => Promise<void>;
  
  // Session management
  loginAsGuest: () => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  
  // State setters
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setRegistrationToken: (token: string | null) => void;
  setGuestId: (guestId: string | null) => void;
  setPhoneNumber: (phoneNumber: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Internal state management
  updateLastActivity: () => void;
  setTokenExpiry: (expiresAt: number) => void;
  incrementRefreshAttempts: () => void;
  resetRefreshAttempts: () => void;
}

// Combined store type
export type AuthStore = AuthState & AuthActions;

// Selectors return types
export interface AuthSelectors {
  isAuthenticated: () => boolean;
  hasValidSession: () => boolean;
  isSessionExpired: () => boolean;
  getSessionType: () => 'user' | 'guest' | 'none';
  shouldRefreshToken: () => boolean;
  getUserDisplayName: () => string;
  getUserInitials: () => string;
}
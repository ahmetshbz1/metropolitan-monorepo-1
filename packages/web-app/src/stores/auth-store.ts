import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WebUser, SocialAuthData } from '@/context/auth/types';

interface AuthState {
  // State
  user: WebUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  registrationToken: string | null;
  isGuest: boolean;
  guestId: string | null;
  phoneNumber: string | null;
  socialAuthData: SocialAuthData | null;
  
  // Computed
  isAuthenticated: boolean;
  
  // Actions
  setUser: (user: WebUser | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setRegistrationToken: (token: string | null) => void;
  setGuest: (isGuest: boolean, guestId: string | null) => void;
  setPhoneNumber: (phone: string | null) => void;
  setSocialAuthData: (data: SocialAuthData | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      registrationToken: null,
      isGuest: false,
      guestId: null,
      phoneNumber: null,
      socialAuthData: null,
      
      // Computed
      get isAuthenticated() {
        const state = get();
        return !!(state.user && state.accessToken);
      },
      
      // Actions
      setUser: (user) => set({ user }),
      
      setTokens: (accessToken, refreshToken) => 
        set({ accessToken, refreshToken, isGuest: false, guestId: null }),
      
      setRegistrationToken: (token) => 
        set({ registrationToken: token }),
      
      setGuest: (isGuest, guestId) => 
        set({ isGuest, guestId }),
      
      setPhoneNumber: (phone) => 
        set({ phoneNumber: phone }),
      
      setSocialAuthData: (data) => 
        set({ socialAuthData: data }),
      
      clearAuth: () => set({
        user: null,
        accessToken: null,
        refreshToken: null,
        registrationToken: null,
        isGuest: false,
        guestId: null,
        phoneNumber: null,
        socialAuthData: null,
      }),
    }),
    {
      name: 'metropolitan-auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        registrationToken: state.registrationToken,
        isGuest: state.isGuest,
        guestId: state.guestId,
      }),
    }
  )
);

import type { SocialAuthData, WebUser } from "@/context/auth/types";
import { tokenStorage } from "@/lib/token-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

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
  _hasHydrated: boolean;

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
  setHasHydrated: (hasHydrated: boolean) => void;
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
      _hasHydrated: false,

      // Computed
      get isAuthenticated() {
        const state = get();
        return !!(state.user && state.accessToken);
      },

      // Actions
      setUser: (user) => set({ user }),

      setTokens: (accessToken, refreshToken) => {
        // Save to both Zustand and tokenStorage
        tokenStorage.saveTokens(accessToken, refreshToken);
        set({ accessToken, refreshToken, isGuest: false, guestId: null });
      },

      setRegistrationToken: (token) => set({ registrationToken: token }),

      setGuest: (isGuest, guestId) => set({ isGuest, guestId }),

      setPhoneNumber: (phone) => set({ phoneNumber: phone }),

      setSocialAuthData: (data) => set({ socialAuthData: data }),

      setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated }),

      clearAuth: () => {
        // Clear both Zustand and tokenStorage
        tokenStorage.clearTokens();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          registrationToken: null,
          isGuest: false,
          guestId: null,
          phoneNumber: null,
          socialAuthData: null,
        });

        // CRITICAL: Also clear from localStorage + sessionStorage manually
        // Because Zustand persist might not sync immediately
        if (typeof window !== "undefined") {
          localStorage.removeItem("metropolitan-auth-storage");
          sessionStorage.removeItem("metropolitan_session_id"); // Backend-generated session ID
          console.log("🧹 Cleared auth from localStorage + sessionStorage");
        }
      },
    }),
    {
      name: "metropolitan-auth-storage",
      storage: createJSONStorage(() => {
        // Only use localStorage on client side
        if (typeof window !== "undefined") {
          return localStorage;
        }
        // Return a dummy storage for SSR
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        registrationToken: state.registrationToken,
        isGuest: state.isGuest,
        guestId: state.guestId,
        socialAuthData: state.socialAuthData,
      }),
      onRehydrateStorage: () => (state) => {
        // After Zustand persist rehydrates, sync tokens to tokenStorage
        if (state) {
          console.log("✅ Zustand hydration complete");
          state.setHasHydrated(true);

          if (state.accessToken && state.refreshToken) {
            console.log("🔄 Syncing tokens from Zustand to tokenStorage");
            console.log("📦 User from storage:", state.user);
            tokenStorage.saveTokens(state.accessToken, state.refreshToken);
          }
        }
      },
    }
  )
);

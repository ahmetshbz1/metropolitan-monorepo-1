import type { SocialAuthData, WebUser } from "@/context/auth/types";
import { tokenStorage } from "@/lib/token-storage";
import { create } from "zustand";

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

// Helper: Save to localStorage
const saveToLocalStorage = (state: Partial<AuthState>) => {
  if (typeof window !== "undefined") {
    try {
      const data = {
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        registrationToken: state.registrationToken,
        isGuest: state.isGuest,
        guestId: state.guestId,
        socialAuthData: state.socialAuthData,
      };
      localStorage.setItem("metropolitan-auth-storage", JSON.stringify(data));
      console.log("💾 Saved to localStorage:", data);
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  }
};

// Helper: Load from localStorage
const loadFromLocalStorage = (): Partial<AuthState> | null => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("metropolitan-auth-storage");
      if (stored) {
        const data = JSON.parse(stored);
        console.log("📦 Loaded from localStorage:", data);
        return data;
      }
    } catch (error) {
      console.error("Failed to load from localStorage:", error);
    }
  }
  return null;
};

export const useAuthStore = create<AuthState>()((set, get) => ({
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
  setUser: (user) => {
    set({ user });
    saveToLocalStorage({ ...get(), user });
  },

  setTokens: (accessToken, refreshToken) => {
    // Save to both Zustand and tokenStorage
    tokenStorage.saveTokens(accessToken, refreshToken);
    set({ accessToken, refreshToken, isGuest: false, guestId: null });
    saveToLocalStorage({ ...get(), accessToken, refreshToken, isGuest: false, guestId: null });
  },

  setRegistrationToken: (token) => {
    set({ registrationToken: token });
    saveToLocalStorage({ ...get(), registrationToken: token });
  },

  setGuest: (isGuest, guestId) => {
    set({ isGuest, guestId });
    saveToLocalStorage({ ...get(), isGuest, guestId });
  },

  setPhoneNumber: (phone) => set({ phoneNumber: phone }),

  setSocialAuthData: (data) => {
    set({ socialAuthData: data });
    saveToLocalStorage({ ...get(), socialAuthData: data });
  },

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

    // Clear from localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("metropolitan-auth-storage");
      sessionStorage.removeItem("metropolitan_session_id");
      console.log("🧹 Cleared auth from localStorage + sessionStorage");
    }
  },
}));

// Initialize from localStorage on client side
if (typeof window !== "undefined") {
  const stored = loadFromLocalStorage();
  if (stored) {
    const { setUser, setTokens, setRegistrationToken, setGuest, setSocialAuthData, setHasHydrated } = useAuthStore.getState();

    if (stored.user) setUser(stored.user);
    if (stored.accessToken && stored.refreshToken) {
      tokenStorage.saveTokens(stored.accessToken, stored.refreshToken);
      useAuthStore.setState({
        accessToken: stored.accessToken,
        refreshToken: stored.refreshToken
      });
    }
    if (stored.registrationToken) setRegistrationToken(stored.registrationToken);

    // Only restore guest session if user is NOT authenticated
    // If user has accessToken, they are logged in and should NOT be a guest
    if (stored.isGuest && stored.guestId && !stored.accessToken) {
      setGuest(stored.isGuest, stored.guestId);
    } else if (stored.accessToken) {
      // User is authenticated, clear any guest data
      setGuest(false, null);
    }

    if (stored.socialAuthData) setSocialAuthData(stored.socialAuthData);

    console.log("✅ Auth state restored from localStorage");
    setHasHydrated(true);
  } else {
    console.log("ℹ️ No auth data in localStorage");
    useAuthStore.getState().setHasHydrated(true);
  }
}

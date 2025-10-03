import type { SocialAuthData, WebUser } from "@/context/auth/types";
import { create } from "zustand";
import { clearSessionId } from "@/lib/device-fingerprint";

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
        return JSON.parse(stored);
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
    set({ accessToken, refreshToken, isGuest: false, guestId: null });
    // Explicitly save with guest data cleared
    saveToLocalStorage({
      user: get().user,
      accessToken,
      refreshToken,
      registrationToken: get().registrationToken,
      isGuest: false,
      guestId: null,
      socialAuthData: get().socialAuthData,
    });
  },

  setRegistrationToken: (token) => {
    set({ registrationToken: token });
    saveToLocalStorage({ ...get(), registrationToken: token });
  },

  setGuest: (isGuest, guestId) => {
    set({ isGuest, guestId });
    // Explicitly save all fields to ensure clean state
    saveToLocalStorage({
      user: get().user,
      accessToken: get().accessToken,
      refreshToken: get().refreshToken,
      registrationToken: get().registrationToken,
      isGuest,
      guestId,
      socialAuthData: get().socialAuthData,
    });
  },

  setPhoneNumber: (phone) => set({ phoneNumber: phone }),

  setSocialAuthData: (data) => {
    set({ socialAuthData: data });
    saveToLocalStorage({ ...get(), socialAuthData: data });
  },

  setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated }),

  clearAuth: () => {
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

    // Clear from localStorage and sessionStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("metropolitan-auth-storage");
      clearSessionId(); // Clear session ID using device-fingerprint function
    }
  },
}));

// Initialize from localStorage on client side
if (typeof window !== "undefined") {
  const stored = loadFromLocalStorage();
  if (stored) {
    // Clean up: If user is authenticated, remove any guest data from localStorage
    if (stored.accessToken && (stored.isGuest || stored.guestId)) {
      stored.isGuest = false;
      stored.guestId = null;
      localStorage.setItem("metropolitan-auth-storage", JSON.stringify(stored));
    }

    const { setUser, setRegistrationToken, setGuest, setSocialAuthData, setHasHydrated } = useAuthStore.getState();

    if (stored.user) setUser(stored.user);
    if (stored.accessToken && stored.refreshToken) {
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
      // User is authenticated, ensure no guest data
      setGuest(false, null);
    }

    if (stored.socialAuthData) setSocialAuthData(stored.socialAuthData);

    setHasHydrated(true);
  } else {
    useAuthStore.getState().setHasHydrated(true);
  }
}

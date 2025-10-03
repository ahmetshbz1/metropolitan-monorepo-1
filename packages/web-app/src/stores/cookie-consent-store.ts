// "cookie-consent-store.ts"
// metropolitan web-app
// Cookie consent state management with Zustand

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CookiePreferences {
  essential: boolean; // Always true, cannot be disabled
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

interface CookieConsentState {
  // Consent state
  hasConsented: boolean;
  showBanner: boolean;
  preferences: CookiePreferences;

  // Actions
  acceptAll: () => void;
  rejectAll: () => void;
  updatePreferences: (preferences: Partial<CookiePreferences>) => void;
  openBanner: () => void;
  closeBanner: () => void;
  resetConsent: () => void;
}

const defaultPreferences: CookiePreferences = {
  essential: true, // Always enabled
  analytics: false,
  marketing: false,
  preferences: false,
};

export const useCookieConsentStore = create<CookieConsentState>()(
  persist(
    (set) => ({
      // Initial state
      hasConsented: false,
      showBanner: true,
      preferences: defaultPreferences,

      // Accept all cookies
      acceptAll: () =>
        set({
          hasConsented: true,
          showBanner: false,
          preferences: {
            essential: true,
            analytics: true,
            marketing: true,
            preferences: true,
          },
        }),

      // Reject all non-essential cookies
      rejectAll: () =>
        set({
          hasConsented: true,
          showBanner: false,
          preferences: {
            essential: true, // Essential cookies cannot be disabled
            analytics: false,
            marketing: false,
            preferences: false,
          },
        }),

      // Update specific preferences
      updatePreferences: (newPreferences) =>
        set((state) => ({
          hasConsented: true,
          showBanner: false,
          preferences: {
            ...state.preferences,
            ...newPreferences,
            essential: true, // Always enforce essential cookies
          },
        })),

      // Show banner again
      openBanner: () => set({ showBanner: true }),

      // Hide banner
      closeBanner: () => set({ showBanner: false }),

      // Reset consent (for testing or privacy settings)
      resetConsent: () =>
        set({
          hasConsented: false,
          showBanner: true,
          preferences: defaultPreferences,
        }),
    }),
    {
      name: "metropolitan-cookie-consent", // localStorage key
      version: 1,
    }
  )
);

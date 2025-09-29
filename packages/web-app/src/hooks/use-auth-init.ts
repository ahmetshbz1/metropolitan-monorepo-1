import { useAuthStore } from "@/stores/auth-store";
import { useEffect } from "react";

/**
 * Initialize auth state from localStorage on mount
 * This ensures auth state is available immediately after page load
 * Similar to mobile-app's initialization pattern
 */
export function useAuthInit() {
  const { setUser, setTokens, setHasHydrated } = useAuthStore();

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    try {
      console.log("🔄 Initializing auth from localStorage...");

      // Read from localStorage directly (bypass Zustand persist issues)
      const authData = localStorage.getItem("metropolitan-auth-storage");

      if (authData) {
        const parsed = JSON.parse(authData);
        const state = parsed.state;

        console.log("📦 Auth data from localStorage:", state);

        // Restore user
        if (state.user) {
          console.log(
            "👤 Restoring user:",
            state.user.firstName,
            state.user.lastName
          );
          setUser(state.user);
        }

        // Restore tokens
        if (state.accessToken && state.refreshToken) {
          console.log("🔑 Restoring tokens");
          setTokens(state.accessToken, state.refreshToken);
        }
      } else {
        console.log("ℹ️ No auth data in localStorage");
      }

      setHasHydrated(true);
      console.log("✅ Auth initialization complete");
    } catch (error) {
      console.error("❌ Auth initialization error:", error);
      setHasHydrated(true);
    }
  }, [setUser, setTokens, setHasHydrated]);
}

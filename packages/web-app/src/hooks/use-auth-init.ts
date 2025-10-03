import { useAuthStore } from "@/stores/auth-store";
import { useEffect } from "react";

/**
 * Initialize auth state from localStorage on mount
 * NOTE: Zustand persist middleware handles the actual rehydration
 * This hook just logs the state for debugging
 */
export function useAuthInit() {
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;
    // Hydration complete - no logging needed
  }, [_hasHydrated, user, accessToken]);
}

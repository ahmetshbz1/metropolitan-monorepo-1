import { useEffect, useState } from "react";

/**
 * Hook to ensure client-side hydration is complete before rendering
 * This prevents hydration mismatches in Next.js SSR
 */
export function useHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // This effect only runs on the client after hydration
    setHydrated(true);
  }, []);

  return hydrated;
}

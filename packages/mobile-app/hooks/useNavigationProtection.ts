//  "useNavigationProtection.ts"
//  metropolitan app
//  Created by Ahmet on [current date].
//
//  Navigation çoklu tıklama koruması için hook

import { useRouter } from "expo-router";
import { useCallback, useRef } from "react";

type NavigationMethod = "push" | "replace" | "back" | "navigate";

interface NavigationOptions {
  debounceTime?: number; // Varsayılan 500ms
}

export function useNavigationProtection(options: NavigationOptions = {}) {
  const router = useRouter();
  const isNavigatingRef = useRef(false);
  const lastNavigationTime = useRef(0);
  const debounceTime = options.debounceTime ?? 500;

  const safeNavigate = useCallback(
    (method: NavigationMethod, ...args: any[]) => {
      const now = Date.now();

      // Debounce kontrolü - son navigasyon'dan bu yana geçen süre
      if (now - lastNavigationTime.current < debounceTime) {
        if (__DEV__) {
          // Removed console statement`);
        }
        return;
      }

      // Eğer zaten navigation işlemi yapılıyorsa, yeni istekleri engelle
      if (isNavigatingRef.current) {
        if (__DEV__) {
          // Removed console statement`);
        }
        return;
      }

      // Navigation'u başlat
      isNavigatingRef.current = true;
      lastNavigationTime.current = now;

      try {
        switch (method) {
          case "push":
            router.push(...args);
            break;
          case "replace":
            router.replace(...args);
            break;
          case "back":
            router.back();
            break;
          case "navigate":
            router.navigate(...args);
            break;
        }
      } catch (error) {
        if (__DEV__) {
          // Removed console statement
        }
      } finally {
        // Navigation işlemi tamamlandıktan sonra flag'i sıfırla
        setTimeout(() => {
          isNavigatingRef.current = false;
        }, 300); // Animasyon süresi için biraz bekle
      }
    },
    [router, debounceTime]
  );

  // Korumalı navigation metodları
  const safePush = useCallback(
    (...args: Parameters<typeof router.push>) => {
      safeNavigate("push", ...args);
    },
    [safeNavigate]
  );

  const safeReplace = useCallback(
    (...args: Parameters<typeof router.replace>) => {
      safeNavigate("replace", ...args);
    },
    [safeNavigate]
  );

  const safeBack = useCallback(() => {
    safeNavigate("back");
  }, [safeNavigate]);

  const safeNavigateMethod = useCallback(
    (...args: Parameters<typeof router.navigate>) => {
      safeNavigate("navigate", ...args);
    },
    [safeNavigate]
  );

  return {
    push: safePush,
    replace: safeReplace,
    back: safeBack,
    navigate: safeNavigateMethod,
    isNavigating: isNavigatingRef.current,
  };
}
//  "useCartData.ts"
//  metropolitan app
//  Created by Ahmet on 09.07.2025.

import { useAuth } from "@/context/AuthContext";
import { CartService } from "@/services/cartService";
import { CartItem, CartSummary } from "@/types/cart";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export const useCartData = () => {
  const { isGuest, guestId, user } = useAuth();
  const { t, i18n } = useTranslation();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to check if user is authenticated
  const isAuthenticated = !!user;
  const hasValidSession = user || (isGuest && guestId);

  // Sepeti backend'den getir (hybrid: user veya guest)
  const refreshCart = useCallback(async () => {
    if (!hasValidSession) {
      setCartItems([]);
      setSummary(null);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const { items, summary } = await CartService.getCart(
        isAuthenticated,
        guestId || undefined,
        i18n.language
      );

      setCartItems(items);
      setSummary(summary);
    } catch (error: any) {
      console.error("Sepet yüklenirken hata:", error);
      setError(error.response?.data?.message || t("cart.load_error"));

      // Hata durumunda boş sepet göster
      setCartItems([]);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, [hasValidSession, isAuthenticated, guestId, i18n.language, t]);

  // Authenticated user ile guest state arasında geçiş olduğunda cart'ı yeniden yükle
  useEffect(() => {
    if (hasValidSession) {
      // Eğer kullanıcı login olduysa veya guest session varsa cart'ı yükle
      refreshCart();
    } else {
      // Hiç kimse login değilse cart'ı temizle
      setCartItems([]);
      setSummary(null);
      setIsLoading(false);
    }
  }, [hasValidSession, refreshCart]);

  return {
    cartItems,
    summary,
    isLoading,
    error,
    refreshCart,
    setError,
    setCartItems,
    setSummary,
    isAuthenticated,
    hasValidSession,
    guestId,
  };
};
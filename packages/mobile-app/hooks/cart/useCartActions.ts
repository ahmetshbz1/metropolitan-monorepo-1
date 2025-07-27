//  "useCartActions.ts"
//  metropolitan app
//  Created by Ahmet on 09.07.2025.

import { CartService } from "@/services/cartService";
import { CartItem } from "@/types/cart";
import { useTranslation } from "react-i18next";

interface UseCartActionsProps {
  refreshCart: () => Promise<void>;
  setError: (error: string | null) => void;
  setCartItems: (items: CartItem[]) => void;
  setSummary: (summary: any) => void;
  isAuthenticated: boolean;
  hasValidSession: boolean;
  guestId?: string;
  cartItems: CartItem[];
}

export const useCartActions = ({
  refreshCart,
  setError,
  setCartItems,
  setSummary,
  isAuthenticated,
  hasValidSession,
  guestId,
  cartItems,
}: UseCartActionsProps) => {
  const { t, i18n } = useTranslation();

  // Sepete ürün ekle (hybrid)
  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!hasValidSession) {
      const error = new Error(t("auth.login_to_continue"));
      (error as any).code = "AUTH_REQUIRED";
      throw error;
    }

    try {
      setError(null);
      await CartService.addToCart(
        isAuthenticated,
        productId,
        quantity,
        guestId || undefined,
        i18n.language
      );
      await refreshCart();
    } catch (error: any) {
      console.error("Sepete ekleme hatası:", error.response?.data || error);
      
      // Auth error'ı olduğu gibi fırlat
      if (error.code === "AUTH_REQUIRED") {
        throw error;
      }
      
      // Backend'den gelen structured error'ı handle et
      const errorPayload = error.response?.data;
      const key = errorPayload?.key;

      if (key && i18n.exists(`errors.${key}`)) {
        const params = errorPayload.params;
        const translatedMessage = t(`errors.${key}`, params);
        setError(translatedMessage);
        
        // Error'ı structured olarak fırlat
        const structuredError = new Error(translatedMessage);
        (structuredError as any).key = key;
        (structuredError as any).params = params;
        throw structuredError;
      } else {
        // Generic error
        const defaultMessage = t("errors.CART_ADD_ERROR");
        setError(defaultMessage);
        throw new Error(defaultMessage);
      }
    }
  };

  // Sepetteki ürün miktarını güncelle (hybrid)
  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!hasValidSession) return;

    if (quantity < 1) {
      const error = new Error(t("cart.min_quantity_error"));
      (error as any).code = "MIN_QUANTITY_ERROR";
      throw error;
    }

    try {
      setError(null);

      // Guest için productId'ye ihtiyacımız var
      const item = cartItems.find((item) => item.id === itemId);
      const productId = item?.product.id;

      await CartService.updateCartItem(
        isAuthenticated,
        itemId,
        quantity,
        guestId || undefined,
        productId,
        i18n.language
      );

      await refreshCart();
    } catch (error: any) {
      console.error("Miktar güncelleme hatası:", error.response?.data || error);
      
      // Validation error'ı olduğu gibi fırlat
      if (error.code === "MIN_QUANTITY_ERROR") {
        throw error;
      }
      
      // Backend'den gelen structured error'ı handle et
      const errorPayload = error.response?.data;
      const key = errorPayload?.key;

      if (key && i18n.exists(`errors.${key}`)) {
        const params = errorPayload.params;
        const translatedMessage = t(`errors.${key}`, params);
        setError(translatedMessage);
        
        // Error'ı structured olarak fırlat
        const structuredError = new Error(translatedMessage);
        (structuredError as any).key = key;
        (structuredError as any).params = params;
        throw structuredError;
      } else {
        // Generic error
        const defaultMessage = t("errors.CART_UPDATE_ERROR");
        setError(defaultMessage);
        throw new Error(defaultMessage);
      }
    }
  };

  // Sepetten ürün kaldır (hybrid)
  const removeItem = async (itemId: string) => {
    if (!hasValidSession) return;

    try {
      setError(null);
      await CartService.removeCartItem(
        isAuthenticated,
        itemId,
        guestId || undefined
      );
      await refreshCart();
      // Başarıyla silindi - toast göstermiyoruz, UI güncellemesi yeterli
    } catch (error: any) {
      console.error("Ürün kaldırma hatası:", error);
      const errorMessage =
        error.response?.data?.message || t("cart.remove_error");
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Sepeti tamamen temizle (hybrid)
  const clearCart = async () => {
    if (!hasValidSession) return;

    try {
      setError(null);
      await CartService.clearCart(
        isAuthenticated,
        guestId || undefined,
        cartItems
      );

      // Local state'i temizle
      setCartItems([]);
      setSummary(null);

      // Success durumunu döndürelim, component toast göstersin
      return { success: true, message: t("cart.cleared") };
    } catch (error: any) {
      console.error("Sepet temizleme hatası:", error);
      const errorMessage =
        error.response?.data?.message || t("cart.clear_error");
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
  };
};
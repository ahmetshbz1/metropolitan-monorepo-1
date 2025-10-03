//  "useCartActions.ts"
//  metropolitan app
//  Created by Ahmet on 09.07.2025.

import { CartService } from "@/services/cartService";
import { CartItem } from "@/types/cart";
import { useTranslation } from "react-i18next";
import { APIError, StructuredError } from "@/types/error.types";
import { useRef, useCallback } from "react";
import { useToast } from "@/hooks/useToast";
import { createGuestSession, generateGuestId } from "@/context/auth/guestUtils";
import { guestStorage } from "@/context/auth/storage";

interface UseCartActionsProps {
  refreshCart: () => Promise<void>;
  setError: (error: string | null) => void;
  setCartItems: (items: CartItem[]) => void;
  setSummary: (summary: any) => void;
  isAuthenticated: boolean;
  hasValidSession: boolean;
  guestId?: string;
  cartItems: CartItem[];
  setGuestId?: (id: string | null) => void;
  setIsGuest?: (value: boolean) => void;
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
  setGuestId,
  setIsGuest,
}: UseCartActionsProps) => {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();

  // Pending updates için ref (debounce yok, sadece toplanıyor)
  const pendingUpdatesRef = useRef<Record<string, number>>({});

  // Sepete ürün ekle (hybrid)
  const addToCart = async (productId: string, quantity: number = 1) => {
    // Eğer ne kullanıcı ne de guest session yoksa, otomatik guest session oluştur
    let currentGuestId = guestId;

    if (!isAuthenticated && !guestId) {
      // Guest session oluştur
      const newGuestId = generateGuestId();
      const result = await createGuestSession(newGuestId);

      if (result.success) {
        currentGuestId = newGuestId;
        await guestStorage.saveGuestId(newGuestId);

        // State'i güncelle (eğer setters varsa)
        if (setGuestId) setGuestId(newGuestId);
        if (setIsGuest) setIsGuest(true);
      } else {
        throw new Error(t("errors.CART_ADD_ERROR"));
      }
    }

    try {
      setError(null);
      await CartService.addToCart(
        isAuthenticated,
        productId,
        quantity,
        currentGuestId || undefined,
        i18n.language
      );
      await refreshCart();
    } catch (error) {
      const apiError = error as APIError;
      console.log("🔴 [useCartActions] addToCart error caught:", {
        status: apiError.response?.status,
        data: apiError.response?.data,
        error,
      });

      // Auth error'ı olduğu gibi fırlat
      if ((error as StructuredError).code === "AUTH_REQUIRED") {
        throw error;
      }

      // Backend'den gelen structured error'ı handle et
      const errorPayload = apiError.response?.data;
      const key = errorPayload?.key;

      if (key && i18n.exists(`errors.${key}`)) {
        const params = errorPayload.params;
        const translatedMessage = t(`errors.${key}`, params);
        setError(translatedMessage);

        // Error'ı structured olarak fırlat
        const structuredError = new Error(translatedMessage) as StructuredError;
        structuredError.key = key;
        structuredError.params = params;
        structuredError.message = translatedMessage;

        console.log("🔴 [useCartActions] Throwing structured error:", structuredError);
        throw structuredError;
      } else {
        // Generic error
        const defaultMessage = t("errors.CART_ADD_ERROR");
        setError(defaultMessage);
        throw new Error(defaultMessage);
      }
    }
  };

  // Pending updates'leri toplu olarak API'ye gönder (batch update)
  const flushPendingUpdates = useCallback(async (throwError: boolean = false) => {
    const updates = { ...pendingUpdatesRef.current };

    if (Object.keys(updates).length === 0) {
      return; // Hiç güncelleme yoksa hiçbir şey yapma
    }

    pendingUpdatesRef.current = {};

    try {
      // Array formatına çevir
      const updatesArray = Object.entries(updates).map(([itemId, quantity]) => ({
        itemId,
        quantity,
      }));

      // Tek batch request'te gönder
      const response = await CartService.batchUpdateCart(
        isAuthenticated,
        updatesArray,
        guestId || undefined,
        i18n.language
      );

      // Sepeti yenile
      await refreshCart();

      // Eğer bazı ürünler otomatik düzeltildiyse kullanıcıya bildir
      if (response?.data?.adjustedItems && response.data.adjustedItems.length > 0) {
        const adjustedItems = response.data.adjustedItems;
        const message = t("cart.stock_adjusted", {
          count: adjustedItems.length,
          products: adjustedItems
            .map((item: any) => `${item.productName} (${item.adjustedQty} ${t("cart.pieces")})`)
            .join(", "),
        });

        // Her zaman toast göster (throwError true/false fark etmez)
        showToast(message, "warning");
      }
    } catch (error: any) {
      // Backend'den gelen structured error'ı handle et
      const apiError = error as APIError;
      const errorPayload = apiError.response?.data;
      const key = errorPayload?.key;

      let errorMessage = t("errors.CART_UPDATE_ERROR");

      if (key && i18n.exists(`errors.${key}`)) {
        const params = errorPayload.params;
        errorMessage = t(`errors.${key}`, params);
      }

      setError(errorMessage);

      // Hata durumunda sepeti yeniden yükle (backend'deki gerçek durumu al)
      await refreshCart();

      // Eğer throwError true ise, hatayı fırlat (checkout için)
      if (throwError) {
        throw new Error(errorMessage);
      }
    }
  }, [isAuthenticated, guestId, i18n, t, refreshCart, setError]);

  // Sepetteki ürün miktarını güncelle (local-only, batch update için bekliyor)
  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!hasValidSession) return;

    if (quantity < 1) {
      const error: StructuredError = new Error(t("cart.min_quantity_error"));
      error.code = "MIN_QUANTITY_ERROR";
      throw error;
    }

    try {
      setError(null);

      // Local state'i hemen güncelle
      const updatedItems = cartItems.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      );
      setCartItems(updatedItems);

      // Summary'yi de local olarak hesapla
      // NOT: Backend'den gelen totalPrice varsa onu kullan, yoksa fallback olarak product fiyatını kullan
      const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = updatedItems.reduce((sum, item) => {
        // Backend'den gelen totalPrice varsa onu kullan
        if (item.totalPrice !== undefined && item.totalPrice !== null) {
          return sum + (typeof item.totalPrice === 'string' ? parseFloat(item.totalPrice) : item.totalPrice);
        }
        // Fallback: product fiyatını kullan (individualPrice > corporatePrice > price)
        const price = item.product.individualPrice ?? item.product.corporatePrice ?? item.product.price;
        return sum + price * item.quantity;
      }, 0);

      setSummary({
        totalItems,
        totalAmount,
        currency: updatedItems[0]?.product.currency || "TRY",
      });

      // Pending update'i kaydet (API'ye hemen gönderilmez)
      pendingUpdatesRef.current[itemId] = quantity;
    } catch (error) {
      // Validation error'ı olduğu gibi fırlat
      if ((error as StructuredError).code === "MIN_QUANTITY_ERROR") {
        throw error;
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
    } catch (error) {
      const apiError = error as APIError;
      // Removed console statement
      const errorMessage =
        apiError.response?.data?.message || t("cart.remove_error");
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
    } catch (error) {
      const apiError = error as APIError;
      // Removed console statement
      const errorMessage =
        apiError.response?.data?.message || t("cart.clear_error");
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    flushPendingUpdates,
  };
};
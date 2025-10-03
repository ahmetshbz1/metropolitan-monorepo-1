import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '@/services/api/cart-api';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores';
import { useGuestAuth } from '../use-guest-auth';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export const cartKeys = {
  all: ['cart'] as const,
  items: (userId?: string, guestId?: string) => [
    ...cartKeys.all,
    'items',
    userId || guestId || 'anonymous',
  ] as const,
};

/**
 * Hybrid Cart Hook
 * Kullanıcı ve misafir sepetlerini yönetir
 */
export function useCart() {
  const setCart = useCartStore((state) => state.setCart);
  const setLoading = useCartStore((state) => state.setLoading);
  const clearCartStore = useCartStore((state) => state.clearCart);

  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const { isGuest, guestId, loginAsGuest } = useGuestAuth();

  // Boolean değer olarak hesapla
  const isAuthenticated = Boolean(user && accessToken);
  const hasValidSession = Boolean(isAuthenticated || (isGuest && guestId));

  // Eğer ne user ne de guest session varsa, otomatik guest session oluştur
  useEffect(() => {
    if (!isAuthenticated && !isGuest && !guestId) {
      console.log('🔄 No session found, creating guest session...');
      loginAsGuest();
    }
  }, [isAuthenticated, isGuest, guestId, loginAsGuest]);

  return useQuery({
    queryKey: cartKeys.items(user?.id, guestId || undefined),
    queryFn: async () => {
      if (!hasValidSession) {
        clearCartStore();
        return {
          items: [],
          summary: {
            totalItems: 0,
            totalAmount: 0,
            currency: 'PLN',
          },
        };
      }

      const response = await cartApi.getCart(
        isAuthenticated,
        guestId || undefined,
        'pl' // Polonya için pl
      );

      setCart(response.items, response.summary);
      return response;
    },
    enabled: hasValidSession,
    staleTime: 30 * 1000, // 30 seconds
    onSettled: () => setLoading(false),
  });
}

/**
 * Sepete ürün ekle (Hybrid)
 */
export function useAddToCart() {
  const queryClient = useQueryClient();
  const setCart = useCartStore((state) => state.setCart);
  const { t, i18n } = useTranslation();

  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = Boolean(user && accessToken);
  const { guestId } = useGuestAuth();

  return useMutation({
    mutationFn: async ({
      productId,
      quantity,
    }: {
      productId: string;
      quantity: number;
    }) => {
      const result = await cartApi.addToCart(
        isAuthenticated,
        productId,
        quantity,
        guestId || undefined
      );

      // Guest için response farklı, o yüzden cart'ı yeniden fetch ediyoruz
      if (!isAuthenticated && guestId) {
        return await cartApi.getCart(false, guestId, 'pl');
      }

      return result;
    },
    onSuccess: (response: any) => {
      // Response CartResponse veya { success, message } olabilir
      if ('items' in response) {
        queryClient.setQueryData(
          cartKeys.items(user?.id, guestId || undefined),
          response
        );
        setCart(response.items, response.summary);
      } else {
        // Guest add response, cart'ı yeniden fetch et
        queryClient.invalidateQueries({
          queryKey: cartKeys.items(user?.id, guestId || undefined),
        });
      }
    },
    onError: (error: any) => {
      // Backend'den gelen structured error'ı handle et
      const errorPayload = error.response?.data;
      const key = errorPayload?.key;

      if (key && i18n.exists(`errors.${key}`)) {
        const params = errorPayload.params || {};
        const translatedMessage = t(`errors.${key}`, params);
        toast.error(translatedMessage);
      } else {
        // Fallback mesaj
        const defaultMessage = error.response?.data?.message || t('errors.CART_ADD_ERROR');
        toast.error(defaultMessage);
      }
    },
  });
}

/**
 * Sepetteki ürün miktarını güncelle (Hybrid)
 */
export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  const setCart = useCartStore((state) => state.setCart);

  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = Boolean(user && accessToken);
  const { guestId } = useGuestAuth();

  return useMutation({
    mutationFn: async ({
      itemId,
      quantity,
      productId,
    }: {
      itemId: string;
      quantity: number;
      productId?: string;
    }) => {
      const result = await cartApi.updateCartItem(
        isAuthenticated,
        itemId,
        quantity,
        guestId || undefined,
        productId
      );

      // Guest için response farklı, cart'ı yeniden fetch ediyoruz
      if (!isAuthenticated && guestId) {
        return await cartApi.getCart(false, guestId, 'pl');
      }

      return result;
    },
    onSuccess: (response: any) => {
      if ('items' in response) {
        queryClient.setQueryData(
          cartKeys.items(user?.id, guestId || undefined),
          response
        );
        setCart(response.items, response.summary);
      } else {
        queryClient.invalidateQueries({
          queryKey: cartKeys.items(user?.id, guestId || undefined),
        });
      }
    },
  });
}

/**
 * Sepetten ürün sil (Hybrid)
 */
export function useRemoveFromCart() {
  const queryClient = useQueryClient();
  const setCart = useCartStore((state) => state.setCart);

  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = Boolean(user && accessToken);
  const { guestId } = useGuestAuth();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const result = await cartApi.removeFromCart(
        isAuthenticated,
        itemId,
        guestId || undefined
      );

      // Guest için cart'ı yeniden fetch et
      if (!isAuthenticated && guestId) {
        return await cartApi.getCart(false, guestId, 'pl');
      }

      return result;
    },
    onSuccess: (response: any) => {
      if ('items' in response) {
        queryClient.setQueryData(
          cartKeys.items(user?.id, guestId || undefined),
          response
        );
        setCart(response.items, response.summary);
      } else {
        queryClient.invalidateQueries({
          queryKey: cartKeys.items(user?.id, guestId || undefined),
        });
      }
    },
  });
}

/**
 * Sepeti temizle (Hybrid)
 */
export function useClearCart() {
  const queryClient = useQueryClient();
  const clearCartStore = useCartStore((state) => state.clearCart);
  const cartItems = useCartStore((state) => state.items);

  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = Boolean(user && accessToken);
  const { guestId } = useGuestAuth();

  return useMutation({
    mutationFn: async () => {
      await cartApi.clearCart(
        isAuthenticated,
        guestId || undefined,
        cartItems
      );
    },
    onSuccess: () => {
      queryClient.setQueryData(cartKeys.items(user?.id, guestId || undefined), {
        items: [],
        summary: {
          totalItems: 0,
          totalAmount: 0,
          currency: 'PLN',
        },
      });
      clearCartStore();
    },
  });
}
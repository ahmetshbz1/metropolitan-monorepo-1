import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '@/services/api/cart-api';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores';

export const cartKeys = {
  all: ['cart'] as const,
  items: () => [...cartKeys.all, 'items'] as const,
};

export function useCart() {
  const setCart = useCartStore((state) => state.setCart);
  const setLoading = useCartStore((state) => state.setLoading);
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: cartKeys.items(),
    queryFn: async () => {
      const response = await cartApi.getCart();
      setCart(response.items, response.summary);
      return response;
    },
    enabled: !!accessToken,
    staleTime: 30 * 1000, // 30 seconds
    onSettled: () => setLoading(false),
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  const setCart = useCartStore((state) => state.setCart);

  return useMutation({
    mutationFn: cartApi.addToCart,
    onSuccess: (response) => {
      queryClient.setQueryData(cartKeys.items(), response);
      setCart(response.items, response.summary);
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  const setCart = useCartStore((state) => state.setCart);

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartApi.updateCartItem(itemId, { quantity }),
    onSuccess: (response) => {
      queryClient.setQueryData(cartKeys.items(), response);
      setCart(response.items, response.summary);
    },
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();
  const setCart = useCartStore((state) => state.setCart);

  return useMutation({
    mutationFn: cartApi.removeFromCart,
    onSuccess: (response) => {
      queryClient.setQueryData(cartKeys.items(), response);
      setCart(response.items, response.summary);
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  const clearCart = useCartStore((state) => state.clearCart);

  return useMutation({
    mutationFn: cartApi.clearCart,
    onSuccess: () => {
      queryClient.setQueryData(cartKeys.items(), { items: [], summary: null });
      clearCart();
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '@/services/api/cart-api';
import { useCartStore } from '@/stores/cart-store';

export const cartKeys = {
  all: ['cart'] as const,
  items: () => [...cartKeys.all, 'items'] as const,
};

export function useCart() {
  const setItems = useCartStore((state) => state.setItems);
  const setLoading = useCartStore((state) => state.setLoading);
  
  return useQuery({
    queryKey: cartKeys.items(),
    queryFn: async () => {
      const items = await cartApi.getCart();
      setItems(items);
      return items;
    },
    onSuccess: () => setLoading(false),
    onError: () => setLoading(false),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  const addItem = useCartStore((state) => state.addItem);
  
  return useMutation({
    mutationFn: cartApi.addToCart,
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.items(), data);
      addItem(data[data.length - 1]); // Add last item to local store
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      cartApi.updateCartItem(productId, { quantity }),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(cartKeys.items(), data);
      updateQuantity(variables.productId, variables.quantity);
    },
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();
  const removeItem = useCartStore((state) => state.removeItem);
  
  return useMutation({
    mutationFn: cartApi.removeFromCart,
    onSuccess: (data, productId) => {
      queryClient.setQueryData(cartKeys.items(), data);
      removeItem(productId);
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  const clearCart = useCartStore((state) => state.clearCart);
  
  return useMutation({
    mutationFn: cartApi.clearCart,
    onSuccess: () => {
      queryClient.setQueryData(cartKeys.items(), []);
      clearCart();
    },
  });
}

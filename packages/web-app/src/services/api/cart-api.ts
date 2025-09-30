import api from '@/lib/api';
import type { CartItem } from '@metropolitan/shared';

interface AddToCartRequest {
  productId: string;
  quantity: number;
}

interface UpdateCartItemRequest {
  quantity: number;
}

interface CartResponse {
  items: CartItem[];
  summary: {
    totalItems: number;
    subtotal: number;
    currency: string;
  };
}

export const cartApi = {
  getCart: async (): Promise<CartResponse> => {
    const response = await api.get('/me/cart');
    return response.data as CartResponse;
  },

  addToCart: async (data: AddToCartRequest): Promise<CartResponse> => {
    const response = await api.post('/me/cart', data);
    // Backend returns CartOperationResponse, we need to fetch full cart
    const cartResponse = await api.get('/me/cart');
    return cartResponse.data as CartResponse;
  },

  updateCartItem: async (itemId: string, data: UpdateCartItemRequest): Promise<CartResponse> => {
    await api.put(`/me/cart/${itemId}`, data);
    // Fetch updated cart
    const response = await api.get('/me/cart');
    return response.data as CartResponse;
  },

  removeFromCart: async (itemId: string): Promise<CartResponse> => {
    await api.delete(`/me/cart/${itemId}`);
    // Fetch updated cart
    const response = await api.get('/me/cart');
    return response.data as CartResponse;
  },

  clearCart: async (): Promise<void> => {
    await api.delete('/me/cart');
  },
};

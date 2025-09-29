import api from '@/lib/api';
import type { CartItem } from '@metropolitan/shared';

interface AddToCartRequest {
  productId: string;
  quantity: number;
}

interface UpdateCartItemRequest {
  quantity: number;
}

export const cartApi = {
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data.data as CartItem[];
  },
  
  addToCart: async (data: AddToCartRequest) => {
    const response = await api.post('/cart/items', data);
    return response.data.data as CartItem[];
  },
  
  updateCartItem: async (productId: string, data: UpdateCartItemRequest) => {
    const response = await api.put(`/cart/items/${productId}`, data);
    return response.data.data as CartItem[];
  },
  
  removeFromCart: async (productId: string) => {
    const response = await api.delete(`/cart/items/${productId}`);
    return response.data.data as CartItem[];
  },
  
  clearCart: async () => {
    const response = await api.delete('/cart');
    return response.data;
  },
  
  syncCart: async (items: CartItem[]) => {
    const response = await api.post('/cart/sync', { items });
    return response.data.data as CartItem[];
  },
};

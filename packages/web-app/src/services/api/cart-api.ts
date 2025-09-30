import api from '@/lib/api';
import type { CartItem, CartSummary } from '@metropolitan/shared';

interface AddToCartRequest {
  productId: string;
  quantity: number;
}

interface UpdateCartItemRequest {
  quantity: number;
}

interface CartResponse {
  items: CartItem[];
  summary: CartSummary;
}

interface GuestCartResponse {
  success: boolean;
  data: {
    items: CartItem[];
    totalAmount: number;
    itemCount: number;
  };
}

/**
 * Cart API - Hybrid (User + Guest)
 * Kullanıcı oturum durumuna göre user veya guest endpoint'lerini kullanır
 */
export const cartApi = {
  // ========== USER CART OPERATIONS ==========
  getUserCart: async (): Promise<CartResponse> => {
    const response = await api.get('/me/cart');
    return response.data as CartResponse;
  },

  addToUserCart: async (data: AddToCartRequest): Promise<CartResponse> => {
    await api.post('/me/cart', data);
    // Fetch updated cart
    const cartResponse = await api.get('/me/cart');
    return cartResponse.data as CartResponse;
  },

  updateUserCartItem: async (itemId: string, data: UpdateCartItemRequest): Promise<CartResponse> => {
    await api.put(`/me/cart/${itemId}`, data);
    // Fetch updated cart
    const response = await api.get('/me/cart');
    return response.data as CartResponse;
  },

  removeUserCartItem: async (itemId: string): Promise<CartResponse> => {
    await api.delete(`/me/cart/${itemId}`);
    // Fetch updated cart
    const response = await api.get('/me/cart');
    return response.data as CartResponse;
  },

  clearUserCart: async (): Promise<void> => {
    await api.delete('/me/cart');
  },

  // ========== GUEST CART OPERATIONS ==========
  getGuestCart: async (guestId: string, lang: string = 'tr'): Promise<CartResponse> => {
    const response = await api.get<GuestCartResponse>(`/guest/cart/${guestId}`, {
      params: { lang },
    });

    if (response.data.success) {
      return {
        items: response.data.data.items,
        summary: {
          totalItems: response.data.data.itemCount,
          totalAmount: response.data.data.totalAmount,
          currency: 'PLN',
        },
      };
    }

    return {
      items: [],
      summary: {
        totalItems: 0,
        totalAmount: 0,
        currency: 'PLN',
      },
    };
  },

  addToGuestCart: async (
    guestId: string,
    productId: string,
    quantity: number
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/guest/cart/add', {
      guestId,
      productId,
      quantity,
    });
    return response.data;
  },

  updateGuestCartItem: async (
    guestId: string,
    itemId: string,
    productId: string,
    quantity: number
  ): Promise<{ success: boolean }> => {
    // Guest için update yok, remove + add yapıyoruz
    await api.delete(`/guest/cart/${guestId}/${itemId}`);
    await api.post('/guest/cart/add', {
      guestId,
      productId,
      quantity,
    });
    return { success: true };
  },

  removeGuestCartItem: async (
    guestId: string,
    itemId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/guest/cart/${guestId}/${itemId}`);
    return response.data;
  },

  clearGuestCart: async (guestId: string, items: CartItem[]): Promise<void> => {
    // Guest için bulk clear yok, tek tek siliyoruz
    for (const item of items) {
      await api.delete(`/guest/cart/${guestId}/${item.id}`);
    }
  },

  // ========== HYBRID OPERATIONS ==========
  getCart: async (isUser: boolean, guestId?: string, lang?: string): Promise<CartResponse> => {
    if (isUser) {
      return cartApi.getUserCart();
    } else if (guestId) {
      return cartApi.getGuestCart(guestId, lang);
    }

    return {
      items: [],
      summary: {
        totalItems: 0,
        totalAmount: 0,
        currency: 'PLN',
      },
    };
  },

  addToCart: async (
    isUser: boolean,
    productId: string,
    quantity: number,
    guestId?: string
  ): Promise<CartResponse | { success: boolean; message: string }> => {
    if (isUser) {
      return cartApi.addToUserCart({ productId, quantity });
    } else if (guestId) {
      return cartApi.addToGuestCart(guestId, productId, quantity);
    }
    throw new Error('No valid session');
  },

  updateCartItem: async (
    isUser: boolean,
    itemId: string,
    quantity: number,
    guestId?: string,
    productId?: string
  ): Promise<CartResponse | { success: boolean }> => {
    if (isUser) {
      return cartApi.updateUserCartItem(itemId, { quantity });
    } else if (guestId && productId) {
      return cartApi.updateGuestCartItem(guestId, itemId, productId, quantity);
    }
    throw new Error('No valid session');
  },

  removeFromCart: async (
    isUser: boolean,
    itemId: string,
    guestId?: string
  ): Promise<CartResponse | { success: boolean; message: string }> => {
    if (isUser) {
      return cartApi.removeUserCartItem(itemId);
    } else if (guestId) {
      return cartApi.removeGuestCartItem(guestId, itemId);
    }
    throw new Error('No valid session');
  },

  clearCart: async (
    isUser: boolean,
    guestId?: string,
    items?: CartItem[]
  ): Promise<void> => {
    if (isUser) {
      return cartApi.clearUserCart();
    } else if (guestId && items) {
      return cartApi.clearGuestCart(guestId, items);
    }
  },
};
import api from '@/lib/api';
import type { Product } from '@metropolitan/shared';

interface GuestFavoriteResponse {
  success: boolean;
  data: Array<{
    id: string;
    product: {
      id: string;
      name: string;
      price: number;
      currency: string;
      stock: number;
      image: string;
      brand: string;
    };
  }>;
}

/**
 * Favorites API - Hybrid (User + Guest)
 * Kullanıcı oturum durumuna göre user veya guest endpoint'lerini kullanır
 */
export const favoritesApi = {
  // ========== USER FAVORITES OPERATIONS ==========
  getUserFavorites: async (lang: string = 'pl'): Promise<Product[]> => {
    const response = await api.get('/users/me/favorites', {
      params: { lang },
    });
    return response.data.data as Product[];
  },

  addUserFavorite: async (productId: string) => {
    const response = await api.post('/users/me/favorites', { productId });
    return response.data;
  },

  removeUserFavorite: async (productId: string) => {
    const response = await api.delete(`/users/me/favorites/${productId}`);
    return response.data;
  },

  // ========== GUEST FAVORITES OPERATIONS ==========
  getGuestFavorites: async (guestId: string, lang: string = 'pl'): Promise<Product[]> => {
    const response = await api.get<GuestFavoriteResponse>(
      `/guest/favorites/${guestId}`,
      { params: { lang } }
    );

    if (response.data.success) {
      // Backend response'u Product[] formatına çevir
      return response.data.data.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        currency: item.product.currency,
        stock: item.product.stock,
        image: item.product.image,
        brand: item.product.brand,
        category: '', // Backend'den gelmiyor ama Product type'ı gerektiriyor
      }));
    }

    return [];
  },

  addGuestFavorite: async (guestId: string, productId: string) => {
    const response = await api.post('/guest/favorites/add', {
      guestId,
      productId,
    });
    return response.data;
  },

  removeGuestFavorite: async (guestId: string, productId: string) => {
    const response = await api.delete(`/guest/favorites/${guestId}/${productId}`);
    return response.data;
  },

  // ========== HYBRID OPERATIONS ==========
  getFavorites: async (
    isUser: boolean,
    guestId?: string,
    lang: string = 'pl'
  ): Promise<Product[]> => {
    if (isUser) {
      return favoritesApi.getUserFavorites(lang);
    } else if (guestId) {
      return favoritesApi.getGuestFavorites(guestId, lang);
    }
    return [];
  },

  addFavorite: async (
    isUser: boolean,
    productId: string,
    guestId?: string
  ) => {
    if (isUser) {
      return favoritesApi.addUserFavorite(productId);
    } else if (guestId) {
      return favoritesApi.addGuestFavorite(guestId, productId);
    }
    throw new Error('No valid session');
  },

  removeFavorite: async (
    isUser: boolean,
    productId: string,
    guestId?: string
  ) => {
    if (isUser) {
      return favoritesApi.removeUserFavorite(productId);
    } else if (guestId) {
      return favoritesApi.removeGuestFavorite(guestId, productId);
    }
    throw new Error('No valid session');
  },

  getFavoriteIds: async (
    isUser: boolean,
    guestId?: string,
    lang: string = 'pl'
  ): Promise<string[]> => {
    const favorites = await favoritesApi.getFavorites(isUser, guestId, lang);
    return favorites.map((f) => f.id);
  },
};
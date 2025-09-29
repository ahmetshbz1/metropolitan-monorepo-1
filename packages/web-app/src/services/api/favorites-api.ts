import api from '@/lib/api';
import type { Product } from '@metropolitan/shared';

export const favoritesApi = {
  getFavorites: async () => {
    const response = await api.get('/users/me/favorites');
    return response.data.data as Product[];
  },

  addFavorite: async (productId: string) => {
    const response = await api.post('/users/me/favorites', { productId });
    return response.data;
  },

  removeFavorite: async (productId: string) => {
    const response = await api.delete(`/users/me/favorites/${productId}`);
    return response.data;
  },

  getFavoriteIds: async () => {
    const favorites = await favoritesApi.getFavorites();
    return favorites.map(f => f.id);
  },
};

import api from '@/lib/api';
import type { Product } from '@metropolitan/shared';

export const favoritesApi = {
  getFavorites: async () => {
    const response = await api.get('/favorites');
    return response.data.data as Product[];
  },
  
  addFavorite: async (productId: string) => {
    const response = await api.post('/favorites', { productId });
    return response.data;
  },
  
  removeFavorite: async (productId: string) => {
    const response = await api.delete(`/favorites/${productId}`);
    return response.data;
  },
  
  getFavoriteIds: async () => {
    const response = await api.get('/favorites/ids');
    return response.data.data as string[];
  },
};

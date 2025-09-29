import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesState {
  favoriteIds: string[];
  isLoading: boolean;
  
  // Actions
  setFavorites: (ids: string[]) => void;
  addFavorite: (productId: string) => void;
  removeFavorite: (productId: string) => void;
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  setLoading: (loading: boolean) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteIds: [],
      isLoading: false,
      
      setFavorites: (ids) => set({ favoriteIds: ids }),
      
      addFavorite: (productId) => set((state) => {
        if (state.favoriteIds.includes(productId)) {
          return state;
        }
        return { favoriteIds: [...state.favoriteIds, productId] };
      }),
      
      removeFavorite: (productId) => set((state) => ({
        favoriteIds: state.favoriteIds.filter(id => id !== productId)
      })),
      
      toggleFavorite: (productId) => set((state) => {
        if (state.favoriteIds.includes(productId)) {
          return { favoriteIds: state.favoriteIds.filter(id => id !== productId) };
        }
        return { favoriteIds: [...state.favoriteIds, productId] };
      }),
      
      isFavorite: (productId) => {
        const state = get();
        return state.favoriteIds.includes(productId);
      },
      
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'metropolitan-favorites-storage',
      partialize: (state) => ({ favoriteIds: state.favoriteIds }),
    }
  )
);

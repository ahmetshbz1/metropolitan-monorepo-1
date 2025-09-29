import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { favoritesApi } from '@/services/api/favorites-api';
import { useFavoritesStore } from '@/stores/favorites-store';

export const favoriteKeys = {
  all: ['favorites'] as const,
  items: () => [...favoriteKeys.all, 'items'] as const,
  ids: () => [...favoriteKeys.all, 'ids'] as const,
};

export function useFavorites() {
  return useQuery({
    queryKey: favoriteKeys.items(),
    queryFn: favoritesApi.getFavorites,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useFavoriteIds() {
  const setFavorites = useFavoritesStore((state) => state.setFavorites);
  
  return useQuery({
    queryKey: favoriteKeys.ids(),
    queryFn: async () => {
      const ids = await favoritesApi.getFavoriteIds();
      setFavorites(ids);
      return ids;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useAddFavorite() {
  const queryClient = useQueryClient();
  const addFavorite = useFavoritesStore((state) => state.addFavorite);
  
  return useMutation({
    mutationFn: favoritesApi.addFavorite,
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: favoriteKeys.ids() });
      const previousIds = queryClient.getQueryData<string[]>(favoriteKeys.ids());
      
      // Optimistic update
      if (previousIds) {
        queryClient.setQueryData<string[]>(favoriteKeys.ids(), [...previousIds, productId]);
      }
      addFavorite(productId);
      
      return { previousIds };
    },
    onError: (err, productId, context) => {
      // Rollback on error
      if (context?.previousIds) {
        queryClient.setQueryData(favoriteKeys.ids(), context.previousIds);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
    },
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);
  
  return useMutation({
    mutationFn: favoritesApi.removeFavorite,
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: favoriteKeys.ids() });
      const previousIds = queryClient.getQueryData<string[]>(favoriteKeys.ids());
      
      // Optimistic update
      if (previousIds) {
        queryClient.setQueryData<string[]>(
          favoriteKeys.ids(),
          previousIds.filter(id => id !== productId)
        );
      }
      removeFavorite(productId);
      
      return { previousIds };
    },
    onError: (err, productId, context) => {
      // Rollback on error
      if (context?.previousIds) {
        queryClient.setQueryData(favoriteKeys.ids(), context.previousIds);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
    },
  });
}

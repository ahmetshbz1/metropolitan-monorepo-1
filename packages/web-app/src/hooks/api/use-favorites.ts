import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { favoritesApi } from '@/services/api/favorites-api';
import { useFavoritesStore } from '@/stores/favorites-store';
import { useAuthStore } from '@/stores';
import { useGuestAuth } from '../use-guest-auth';
import { useEffect } from 'react';

export const favoriteKeys = {
  all: ['favorites'] as const,
  items: (userId?: string, guestId?: string) => [
    ...favoriteKeys.all,
    'items',
    userId || guestId || 'anonymous',
  ] as const,
  ids: (userId?: string, guestId?: string) => [
    ...favoriteKeys.all,
    'ids',
    userId || guestId || 'anonymous',
  ] as const,
};

/**
 * Hybrid Favorites Hook
 * Kullanıcı ve misafir favorilerini yönetir
 */
export function useFavorites() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const isAuthenticated = Boolean(user && accessToken);
  const { isGuest, guestId } = useGuestAuth();

  const hasValidSession = Boolean(isAuthenticated || (isGuest && guestId));

  // Don't create guest session here - let useCart handle it
  // This prevents multiple guest sessions being created

  return useQuery({
    queryKey: favoriteKeys.items(user?.id, guestId || undefined),
    queryFn: () => favoritesApi.getFavorites(isAuthenticated, guestId || undefined, 'pl'),
    enabled: hasValidSession && _hasHydrated,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Favorite ID'lerini getir (isFavorite kontrolü için)
 */
export function useFavoriteIds() {
  const setFavorites = useFavoritesStore((state) => state.setFavorites);
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const isAuthenticated = Boolean(user && accessToken);
  const { isGuest, guestId } = useGuestAuth();

  const hasValidSession = Boolean(isAuthenticated || (isGuest && guestId));

  return useQuery({
    queryKey: favoriteKeys.ids(user?.id, guestId || undefined),
    queryFn: async () => {
      const ids = await favoritesApi.getFavoriteIds(
        isAuthenticated,
        guestId || undefined,
        'pl'
      );
      setFavorites(ids);
      return ids;
    },
    enabled: hasValidSession && _hasHydrated,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Favorilere ürün ekle (Hybrid)
 */
export function useAddFavorite() {
  const queryClient = useQueryClient();
  const addFavorite = useFavoritesStore((state) => state.addFavorite);

  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = Boolean(user && accessToken);
  const { guestId } = useGuestAuth();

  return useMutation({
    mutationFn: async (productId: string) => {
      return favoritesApi.addFavorite(isAuthenticated, productId, guestId || undefined);
    },
    onMutate: async (productId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: favoriteKeys.ids(user?.id, guestId || undefined),
      });

      const previousIds = queryClient.getQueryData<string[]>(
        favoriteKeys.ids(user?.id, guestId || undefined)
      );

      // Optimistic update
      if (previousIds) {
        queryClient.setQueryData<string[]>(
          favoriteKeys.ids(user?.id, guestId || undefined),
          [...previousIds, productId]
        );
      }
      addFavorite(productId);

      return { previousIds };
    },
    onError: (err, productId, context) => {
      // Rollback on error
      if (context?.previousIds) {
        queryClient.setQueryData(
          favoriteKeys.ids(user?.id, guestId || undefined),
          context.previousIds
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: favoriteKeys.all,
      });
    },
  });
}

/**
 * Favorilerden ürün sil (Hybrid)
 */
export function useRemoveFavorite() {
  const queryClient = useQueryClient();
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);

  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = Boolean(user && accessToken);
  const { guestId } = useGuestAuth();

  return useMutation({
    mutationFn: async (productId: string) => {
      return favoritesApi.removeFavorite(
        isAuthenticated,
        productId,
        guestId || undefined
      );
    },
    onMutate: async (productId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: favoriteKeys.ids(user?.id, guestId || undefined),
      });

      const previousIds = queryClient.getQueryData<string[]>(
        favoriteKeys.ids(user?.id, guestId || undefined)
      );

      // Optimistic update
      if (previousIds) {
        queryClient.setQueryData<string[]>(
          favoriteKeys.ids(user?.id, guestId || undefined),
          previousIds.filter((id) => id !== productId)
        );
      }
      removeFavorite(productId);

      return { previousIds };
    },
    onError: (err, productId, context) => {
      // Rollback on error
      if (context?.previousIds) {
        queryClient.setQueryData(
          favoriteKeys.ids(user?.id, guestId || undefined),
          context.previousIds
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: favoriteKeys.all,
      });
    },
  });
}
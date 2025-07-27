//  "FavoritesContext.tsx"
//  metropolitan app
//  Created by Ahmet on 22.06.2025.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { useAuth } from "./AuthContext";
import { Product } from "./ProductContext";
import { 
  fetchFavoritesFromApi, 
  addFavoriteToApi, 
  removeFavoriteFromApi 
} from "@/hooks/favorites/useFavoritesApi";
import { handleMinimumLoadingTime } from "@/utils/favorites/favoritesUtils";

type FavoritesContextType = {
  favorites: Product[];
  toggleFavorite: (product: Product) => void;
  isFavorite: (productId: string) => boolean;
  isLoading: boolean;
  error: string | null;
  fetchFavorites: () => void;
  reloadFavorites: () => void;
};

export const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  toggleFavorite: () => {},
  isFavorite: () => false,
  isLoading: true,
  error: null,
  fetchFavorites: () => {},
  reloadFavorites: () => {},
});

export const useFavorites = () => useContext(FavoritesContext);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isGuest, guestId } = useAuth();
  const { i18n } = useTranslation();

  const [favorites, setFavorites] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = useCallback(
    async (clearList = false) => {
      if (!user && !isGuest) {
        setFavorites([]);
        setIsLoading(false);
        return;
      }

      setError(null);
      setIsLoading(true);
      if (clearList) {
        setFavorites([]);
      }

      const startTime = Date.now();
      try {
        const lang = i18n.language || "tr";
        const fetchedFavorites = await fetchFavoritesFromApi({
          user,
          isGuest,
          guestId,
          lang,
        });
        setFavorites(fetchedFavorites);
      } catch (error) {
        console.error("Failed to fetch favorites:", error);
        setError(
          "A network error occurred. Please check your connection and try again."
        );
      } finally {
        handleMinimumLoadingTime(startTime, () => setIsLoading(false));
      }
    },
    [user, isGuest, guestId, i18n.language]
  );

  const reloadFavorites = useCallback(() => {
    fetchFavorites(true);
  }, [fetchFavorites]);

  // Authenticated user ile guest state arasında geçiş olduğunda favorites'i yeniden yükle
  useEffect(() => {
    if (user || (isGuest && guestId)) {
      fetchFavorites();
    } else {
      setFavorites([]);
    }
  }, [user, isGuest, guestId, fetchFavorites]);

  const toggleFavorite = async (product: Product) => {
    if (!user && !isGuest) {
      return;
    }

    const isCurrentlyFavorite = favorites.some((fav) => fav.id === product.id);

    // Optimistic UI - Anında güncelle
    const previousFavorites = favorites;
    if (isCurrentlyFavorite) {
      setFavorites((prev) => prev.filter((fav) => fav.id !== product.id));
    } else {
      setFavorites((prev) => [...prev, product]);
    }

    try {
      if (isCurrentlyFavorite) {
        await removeFavoriteFromApi(product.id, { user, isGuest, guestId });
      } else {
        await addFavoriteToApi(product.id, { user, isGuest, guestId });
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      // Hata durumunda eski haline geri dön
      setFavorites(previousFavorites);
    }
  };

  const isFavorite = (productId: string) => {
    return favorites.some((fav) => fav.id === productId);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        toggleFavorite,
        isFavorite,
        isLoading,
        error,
        fetchFavorites,
        reloadFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

//  "FavoritesContext.tsx"
//  metropolitan app
//  Created by Ahmet on 22.06.2025.

import { api } from "@/core/api";
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

const MINIMUM_LOADING_TIME = 500; // 0.5 seconds

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
  const { t, i18n } = useTranslation();

  const [favorites, setFavorites] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Favorite item'ı normalize et (user ve guest endpoint'leri arasındaki farkları gider)
  const normalizeFavoriteItem = (item: any): Product => {
    const product = item.product || item;
    return {
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      stock: product.stock,
      image: product.imageUrl || product.image,
      category: product.category || "",
    };
  };

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
        let data;
        // Backend'in beklediği dil kodu (tr, en, pl)
        const lang = i18n.language || "tr";

        if (user) {
          // Authenticated user
          const response = await api.get("/users/me/favorites", {
            params: { lang },
          });
          data = response.data;

          if (data.success) {
            setFavorites(data.data.map(normalizeFavoriteItem));
          } else {
            setError("Could not fetch favorites.");
          }
        } else if (isGuest && guestId) {
          // Guest user
          const response = await api.get(`/guest/favorites/${guestId}`, {
            params: { lang },
          });
          data = response.data;

          if (data.success) {
            setFavorites(data.data.map(normalizeFavoriteItem));
          } else {
            setError("Could not fetch favorites.");
          }
        }
      } catch (error) {
        console.error("Failed to fetch favorites:", error);
        setError(
          "A network error occurred. Please check your connection and try again."
        );
      } finally {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = MINIMUM_LOADING_TIME - elapsedTime;

        if (remainingTime > 0) {
          setTimeout(() => setIsLoading(false), remainingTime);
        } else {
          setIsLoading(false);
        }
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
      // Eğer kullanıcı login olduysa veya guest session varsa favorites'i yükle
      fetchFavorites();
    } else {
      // Hiç kimse login değilse favorites'i temizle
      setFavorites([]);
    }
  }, [user, isGuest, guestId, fetchFavorites]);

  const toggleFavorite = async (product: Product) => {
    if (!user && !isGuest) {
      return;
    }

    const isCurrentlyFavorite = favorites.some((fav) => fav.id === product.id);

    const previousFavorites = favorites;
    if (isCurrentlyFavorite) {
      setFavorites((prev) => prev.filter((fav) => fav.id !== product.id));
    } else {
      setFavorites((prev) => [...prev, product]);
    }

    try {
      if (user) {
        // Authenticated user
        if (isCurrentlyFavorite) {
          await api.delete(`/users/me/favorites/${product.id}`);
        } else {
          await api.post("/users/me/favorites", { productId: product.id });
        }
      } else if (isGuest && guestId) {
        // Guest user
        if (isCurrentlyFavorite) {
          await api.delete(`/guest/favorites/${guestId}/${product.id}`);
        } else {
          await api.post("/guest/favorites/add", {
            guestId,
            productId: product.id,
          });
        }
      }

      // Re-fetch without clearing for optimistic updates
      await fetchFavorites(false);
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      // Revert optimistic update on error
      setFavorites(previousFavorites);
      // Re-sync on error
      await fetchFavorites(false);
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

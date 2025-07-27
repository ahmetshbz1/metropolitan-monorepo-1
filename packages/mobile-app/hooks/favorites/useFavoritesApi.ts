//  "useFavoritesApi.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import { api } from "@/core/api";
import { Product } from "@/context/ProductContext";

interface FavoritesApiParams {
  user: any;
  isGuest: boolean;
  guestId: string;
  lang: string;
}

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

export const fetchFavoritesFromApi = async ({
  user,
  isGuest,
  guestId,
  lang,
}: FavoritesApiParams): Promise<Product[]> => {
  if (!user && !isGuest) {
    return [];
  }

  let data;

  if (user) {
    // Authenticated user
    const response = await api.get("/users/me/favorites", {
      params: { lang },
    });
    data = response.data;

    if (data.success) {
      return data.data.map(normalizeFavoriteItem);
    } else {
      throw new Error("Could not fetch favorites.");
    }
  } else if (isGuest && guestId) {
    // Guest user
    const response = await api.get(`/guest/favorites/${guestId}`, {
      params: { lang },
    });
    data = response.data;

    if (data.success) {
      return data.data.map(normalizeFavoriteItem);
    } else {
      throw new Error("Could not fetch favorites.");
    }
  }

  return [];
};

export const addFavoriteToApi = async (
  productId: string,
  { user, isGuest, guestId }: Omit<FavoritesApiParams, "lang">
) => {
  if (user) {
    // Authenticated user
    await api.post("/users/me/favorites", { productId });
  } else if (isGuest && guestId) {
    // Guest user
    await api.post("/guest/favorites/add", {
      guestId,
      productId,
    });
  }
};

export const removeFavoriteFromApi = async (
  productId: string,
  { user, isGuest, guestId }: Omit<FavoritesApiParams, "lang">
) => {
  if (user) {
    // Authenticated user
    await api.delete(`/users/me/favorites/${productId}`);
  } else if (isGuest && guestId) {
    // Guest user
    await api.delete(`/guest/favorites/${guestId}/${productId}`);
  }
};

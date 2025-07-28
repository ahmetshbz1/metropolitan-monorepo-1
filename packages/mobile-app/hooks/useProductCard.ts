//  "useProductCard.ts"
//  metropolitan app
//  Created by Ahmet on 05.07.2025.

import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useProducts } from "@/context/ProductContext";
import { useHaptics } from "@/hooks/useHaptics";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/useToast";
import { Product } from "@metropolitan/shared";
import { useRouter } from "expo-router";
import { getErrorMessage } from "@/types/error";
import type { GestureResponderEvent } from "react-native";

export const useProductCard = (product: Product) => {
  const { colors, colorScheme } = useTheme();
  const { addToCart, cartItems } = useCart();
  const { triggerHaptic } = useHaptics();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { categories } = useProducts();
  const { showToast } = useToast();
  const router = useRouter();

  // Computed values
  const isProductFavorite = isFavorite(product.id);
  const categoryName = categories.find(
    (cat) => cat.slug === product.category
  )?.name;
  const isLowStock = product.stock < 10;
  const isOutOfStock = product.stock === 0;
  const isProductInCart = cartItems.some(
    (item) => item.product.id === product.id
  );

  // Actions
  const handleAddToCart = async (e: GestureResponderEvent) => {
    e.preventDefault();
    e.stopPropagation();

    triggerHaptic("light");
    
    try {
      await addToCart(product.id, 1);
    } catch (error) {
      // Stok yetersizliği veya diğer hatalar için toast göster
      showToast(getErrorMessage(error) || "Ürün sepete eklenemedi", "error");
    }
  };

  const handleToggleFavorite = () => {
    toggleFavorite(product);
  };

  return {
    // State
    colors,
    colorScheme,
    isProductFavorite,
    categoryName,
    isLowStock,
    isOutOfStock,
    isProductInCart,

    // Actions
    handleAddToCart,
    handleToggleFavorite,
  };
};

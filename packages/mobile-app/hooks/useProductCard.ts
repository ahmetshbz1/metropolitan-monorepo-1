//  "useProductCard.ts"
//  metropolitan app
//  Created by Ahmet on 05.07.2025.

import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { Product, useProducts } from "@/context/ProductContext";
import { useHaptics } from "@/hooks/useHaptics";
import { useTheme } from "@/hooks/useTheme";

export const useProductCard = (product: Product) => {
  const { colors, colorScheme } = useTheme();
  const { addToCart } = useCart();
  const { triggerHaptic } = useHaptics();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { categories } = useProducts();

  // Computed values
  const isProductFavorite = isFavorite(product.id);
  const categoryName = categories.find(
    (cat) => cat.slug === product.category
  )?.name;
  const isLowStock = product.stock < 10;
  const isOutOfStock = product.stock === 0;

  // Actions
  const handleAddToCart = async (e: any) => {
    e.preventDefault();
    e.stopPropagation();

    triggerHaptic("light");
    await addToCart(product.id, 1);
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

    // Actions
    handleAddToCart,
    handleToggleFavorite,
  };
};

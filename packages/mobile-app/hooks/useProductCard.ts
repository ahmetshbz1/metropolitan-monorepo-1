//  "useProductCard.ts"
//  metropolitan app
//  Created by Ahmet on 05.07.2025.

import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useProducts } from "@/context/ProductContext";
import { useAuth } from "@/context/AuthContext";
import { useHaptics } from "@/hooks/useHaptics";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/useToast";
import { Product } from "@metropolitan/shared";
import { useRouter } from "expo-router";
import { getErrorMessage, StructuredError } from "@/types/error";
import { useTranslation } from "react-i18next";
import type { GestureResponderEvent } from "react-native";
import { useState } from "react";

export const useProductCard = (product: Product) => {
  const { t } = useTranslation();
  const { colors, colorScheme } = useTheme();
  const { addToCart, cartItems } = useCart();
  const { triggerHaptic } = useHaptics();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { categories } = useProducts();
  const { showToast } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  const [showMinQuantityDialog, setShowMinQuantityDialog] = useState(false);
  const [minQuantityError, setMinQuantityError] = useState<number | null>(null);
  const [isAddingMinQuantity, setIsAddingMinQuantity] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Computed values
  const userType = user?.userType || "individual";
  const displayPrice = userType === "corporate" && product.corporatePrice !== undefined
    ? product.corporatePrice
    : userType === "individual" && product.individualPrice !== undefined
    ? product.individualPrice
    : product.price;

  const minQuantity = userType === "corporate"
    ? (product.minQuantityCorporate ?? 1)
    : (product.minQuantityIndividual ?? 1);

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
    // Race condition koruması: Eğer zaten ekleme işlemi devam ediyorsa, yeni request gönderme
    if (isAddingToCart) return;

    e.preventDefault();
    e.stopPropagation();

    triggerHaptic();
    setIsAddingToCart(true);

    try {
      await addToCart(product.id, 1);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      const structuredError = error as StructuredError;

      if (structuredError.key === "MIN_QUANTITY_NOT_MET" && structuredError.params?.minQuantity) {
        const minQty = structuredError.params.minQuantity;
        setMinQuantityError(minQty);
        setShowMinQuantityDialog(true);
      } else if (errorMessage === "UNEXPECTED_ERROR") {
        showToast(t("errors.UNEXPECTED_ERROR"), "error");
      } else {
        showToast(errorMessage || t("errors.CART_ADD_ERROR"), "error");
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleAddMinQuantity = async () => {
    if (!minQuantityError) return;

    setIsAddingMinQuantity(true);
    try {
      await addToCart(product.id, minQuantityError);
      showToast(t("cart.item_added"), "success", 3000);
      setShowMinQuantityDialog(false);
      setMinQuantityError(null);
    } catch (addError) {
      const addErrorMessage = getErrorMessage(addError);
      showToast(addErrorMessage || t("errors.CART_ADD_ERROR"), "error", 3000);
    } finally {
      setIsAddingMinQuantity(false);
    }
  };

  const handleCloseDialog = () => {
    setShowMinQuantityDialog(false);
    setMinQuantityError(null);
  };

  const handleToggleFavorite = (e?: GestureResponderEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    triggerHaptic();
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
    displayPrice,
    minQuantity,

    // Dialog state
    showMinQuantityDialog,
    minQuantityError,
    isAddingMinQuantity,
    isAddingToCart,

    // Actions
    handleAddToCart,
    handleToggleFavorite,
    handleAddMinQuantity,
    handleCloseDialog,
  };
};

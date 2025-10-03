//  "useCartItem.ts"
//  metropolitan app
//  Created by Ahmet on 08.07.2025.

import { CartItem as CartItemType, useCart } from "@/context/CartContext";
import { useProducts } from "@/context/ProductContext";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

export const useCartItem = (item: CartItemType) => {
  const { colors, colorScheme } = useTheme();
  const { products } = useProducts();
  const { summary } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  // Find the full product details from the ProductContext
  const product = products.find((p) => p.id === item.product.id);

  if (!product) {
    return null;
  }

  // Kullanıcı tipine göre minimum alım miktarını ve fiyatı belirle
  const userType = user?.userType || "individual";

  // Kullanıcı tipine göre doğru fiyatı hesapla
  const unitPrice = userType === "corporate" && product.corporatePrice !== undefined
    ? product.corporatePrice
    : userType === "individual" && product.individualPrice !== undefined
    ? product.individualPrice
    : product.price;

  const totalItemPrice = unitPrice * item.quantity;
  const minQuantity = userType === "corporate"
    ? (product.minQuantityCorporate ?? 1)
    : (product.minQuantityIndividual ?? 1);

  // Actions
  const handleProductPress = () => {
    router.push(`/product/${product.id}`);
  };

  const handleIncrement = (onUpdateQuantity: (quantity: number) => void) => {
    onUpdateQuantity(item.quantity + minQuantity);
  };

  const handleDecrement = (onUpdateQuantity: (quantity: number) => void) => {
    if (item.quantity > minQuantity) {
      onUpdateQuantity(item.quantity - minQuantity);
    }
  };

  const handleSwipeWillOpen = (direction: "left" | "right") => {
    // İlk kaydırmada hafif titreşim
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDelete = (onRemove: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRemove();
  };

  return {
    // Data
    product,
    totalItemPrice,
    colors,
    colorScheme,
    summary,
    minQuantity,

    // Actions
    handleProductPress,
    handleIncrement,
    handleDecrement,
    handleSwipeWillOpen,
    handleDelete,
  };
};

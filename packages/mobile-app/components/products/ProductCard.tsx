//  "ProductCard.tsx"
//  metropolitan app
//  Created by Ahmet on 30.06.2025. Edited on 23.07.2025.

import { ThemedText } from "@/components/ThemedText";
import { Product } from "@/context/ProductContext";
import { useProductCard } from "@/hooks/useProductCard";
import { useHaptics } from "@/hooks/useHaptics";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import React, { useRef } from "react";
import { TouchableOpacity, View, Animated } from "react-native";
import { HapticIconButton } from "../HapticButton";
import { ProductCardContent } from "./ProductCardContent";
import { ProductCardImage } from "./ProductCardImage";

interface ProductCardProps {
  product: Product;
  variant?: "grid" | "horizontal";
}

// Helper function to determine favorite icon color
const getFavoriteIconColor = (
  isFavorite: boolean,
  colorScheme: string,
  colors: any
): string => {
  if (isFavorite) return colors.danger;
  return colorScheme === "dark" ? "#fff" : "#000";
};

export const ProductCard = React.memo<ProductCardProps>(function ProductCard({
  product,
  variant = "grid",
}) {
  const {
    colors,
    colorScheme,
    isProductFavorite,
    categoryName,
    isLowStock,
    isOutOfStock,
    handleAddToCart,
    handleToggleFavorite,
  } = useProductCard(product);
  const { triggerHaptic } = useHaptics();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const isHorizontal = variant === "horizontal";

  const handlePressIn = () => {
    triggerHaptic();
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 20,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 0,
    }).start();
  };

  return (
    <Animated.View
      className={isHorizontal ? "mr-3" : "mb-3"}
      style={[
        isHorizontal ? { width: 180 } : { flex: 1/3 },
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      <Link
        href={{
          pathname: "/product/[id]",
          params: { id: product.id },
        }}
        asChild
      >
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          className="overflow-hidden rounded-3xl border"
          style={{
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
            shadowColor: colorScheme === "dark" ? "#000" : colors.tint,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: colorScheme === "dark" ? 0.3 : 0.12,
            shadowRadius: 12,
            elevation: 6,
          }}
        >

          <ProductCardImage
            product={product}
            colorScheme={colorScheme}
            isOutOfStock={isOutOfStock}
            colors={colors}
          />

          <ProductCardContent
            product={product}
            categoryName={categoryName}
            colorScheme={colorScheme}
            colors={colors}
            isOutOfStock={isOutOfStock}
            isLowStock={isLowStock}
            handleAddToCart={handleAddToCart}
          />

          <HapticIconButton
            onPress={handleToggleFavorite}
            className="absolute top-1 right-3 w-8 h-8 justify-center items-center z-10"
          >
            <Ionicons
              name={isProductFavorite ? "heart" : "heart-outline"}
              size={20}
              color={getFavoriteIconColor(isProductFavorite, colorScheme, colors)}
            />
          </HapticIconButton>
        </TouchableOpacity>
      </Link>
    </Animated.View>
  );
});

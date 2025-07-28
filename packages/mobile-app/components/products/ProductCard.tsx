//  "ProductCard.tsx"
//  metropolitan app
//  Created by Ahmet on 30.06.2025. Edited on 23.07.2025.

import { ThemedText } from "@/components/ThemedText";
import { Product } from "@/context/ProductContext";
import { useProductCard } from "@/hooks/useProductCard";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { HapticIconButton } from "../HapticButton";
import { ProductCardContent } from "./ProductCardContent";
import { ProductCardImage } from "./ProductCardImage";

interface ProductCardProps {
  product: Product;
  variant?: "grid" | "horizontal";
}

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

  const isHorizontal = variant === "horizontal";

  return (
    <View
      className={isHorizontal ? "mr-3" : "mx-1 mb-3"}
      style={isHorizontal ? { width: 180 } : { width: "48%" }}
    >
      <Link
        href={{
          pathname: "/product/[id]",
          params: { id: product.id },
        }}
        asChild
      >
        <TouchableOpacity
          activeOpacity={0.9}
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
          {/* Brand Badge - Top Left */}
          {product.brand && (
            <View className="absolute top-3 left-3 z-10 px-2 py-1 rounded-full" style={{ backgroundColor: colorScheme === "dark" ? colors.tertiaryBackground : colors.background }}>
              <ThemedText
                className="text-xs font-medium uppercase tracking-wide"
                style={{
                  color: colorScheme === "dark" ? colors.mediumGray : "#6b7280",
                  fontSize: 10,
                }}
                numberOfLines={1}
              >
                {product.brand}
              </ThemedText>
            </View>
          )}

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
            hapticType="light"
          >
            <Ionicons
              name={isProductFavorite ? "heart" : "heart-outline"}
              size={20}
              color={
                isProductFavorite
                  ? colors.danger
                  : colorScheme === "dark"
                    ? "#fff"
                    : "#000"
              }
            />
          </HapticIconButton>
        </TouchableOpacity>
      </Link>
    </View>
  );
});

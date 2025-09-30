//  "ProductCardContent.tsx"
//  metropolitan app
//  Created by Ahmet on 26.06.2025. Edited on 23.07.2025.

import { formatPrice } from "@/core/utils";
import React from "react";
import { useTranslation } from "react-i18next";
import { ColorSchemeName, View, GestureResponderEvent } from "react-native";
import { ThemedText } from "../ThemedText";
import type { Product } from "@metropolitan/shared";
import type { ThemeColors } from "@/types/theme";

interface ProductCardContentProps {
  product: Product;
  categoryName?: string;
  colorScheme: ColorSchemeName;
  colors: ThemeColors;
  isOutOfStock: boolean;
  isLowStock: boolean;
  handleAddToCart: (e: GestureResponderEvent) => Promise<void>;
}

export const ProductCardContent: React.FC<ProductCardContentProps> = ({
  product,
  categoryName,
  colorScheme,
  colors,
  isOutOfStock,
  isLowStock,
  handleAddToCart,
}) => {
  const { t } = useTranslation();

  return (
    <View className="px-2 py-2" style={{ backgroundColor: colors.cardBackground, minHeight: 75 }}>
      {/* Price - Top */}
      <ThemedText
        className="text-base font-extrabold"
        style={{
          color: colors.primary,
          marginBottom: 4,
          letterSpacing: -0.3,
        }}
      >
        {formatPrice(product.price, product.currency)}
      </ThemedText>

      {/* Product Name */}
      <ThemedText
        className="text-xs font-bold"
        numberOfLines={2}
        style={{
          lineHeight: 14,
          color: colorScheme === "dark" ? "#ffffff" : "#000000",
          letterSpacing: -0.2,
          marginBottom: 4,
          minHeight: 28,
        }}
      >
        {product.name}
      </ThemedText>

      {/* Bottom Section - Size and Stock */}
      <View className="flex-row items-center justify-between" style={{ marginTop: 'auto' }}>
        {/* Size/Unit Info */}
        {product.size && (
          <ThemedText
            className="text-xs font-semibold"
            style={{
              color: colorScheme === "dark" ? "#a3a3a3" : "#737373",
            }}
          >
            {product.size}
          </ThemedText>
        )}

        {/* Stock Status */}
        {isLowStock && !isOutOfStock && (
          <View className="flex-row items-center">
            <View className="w-1.5 h-1.5 bg-amber-400 rounded-full mr-1" />
            <ThemedText
              className="text-xs font-bold"
              style={{ color: colorScheme === "dark" ? "#fbbf24" : "#d97706" }}
            >
              {product.stock}
            </ThemedText>
          </View>
        )}
      </View>
    </View>
  );
};

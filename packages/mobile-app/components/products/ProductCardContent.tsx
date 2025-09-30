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
    <View className="p-2" style={{ backgroundColor: colors.cardBackground, minHeight: 100 }}>
      {/* Price - Top */}
      <ThemedText
        className="font-bold text-base mb-1"
        style={{ color: colors.primary }}
      >
        {formatPrice(product.price, product.currency)}
      </ThemedText>

      {/* Product Name - Middle */}
      <ThemedText
        className="text-xs mb-auto"
        numberOfLines={2}
        style={{
          lineHeight: 16,
          color: colorScheme === "dark" ? "#e5e5e5" : "#3f3f3f",
          letterSpacing: -0.1,
        }}
      >
        {product.name}
      </ThemedText>

      {/* Bottom Section */}
      <View className="mt-2">
        {/* Size/Unit Info */}
        {product.size && (
          <ThemedText
            className="text-xs mb-1"
            style={{ color: colorScheme === "dark" ? "#a3a3a3" : "#737373" }}
          >
            {product.size}
          </ThemedText>
        )}

        {/* Stock Status */}
        {isLowStock && !isOutOfStock && (
          <View className="flex-row items-center">
            <View className="w-1 h-1 bg-amber-400 rounded-full mr-1.5" />
            <ThemedText
              className="text-xs font-medium"
              style={{ color: colorScheme === "dark" ? "#fbbf24" : "#d97706" }}
            >
              Son {product.stock}
            </ThemedText>
          </View>
        )}
      </View>
    </View>
  );
};

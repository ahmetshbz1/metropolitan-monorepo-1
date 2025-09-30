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
    <View className="px-1.5 py-1" style={{ backgroundColor: colors.cardBackground, height: 75, position: 'relative' }}>
      {/* Price - Top */}
      <ThemedText
        className="font-bold text-sm"
        style={{ color: colors.primary, marginBottom: 2 }}
      >
        {formatPrice(product.price, product.currency)}
      </ThemedText>

      {/* Product Name - Middle */}
      <ThemedText
        className="text-xs font-semibold"
        numberOfLines={2}
        style={{
          lineHeight: 13,
          color: colorScheme === "dark" ? "#f3f4f6" : "#1f2937",
          letterSpacing: -0.1,
          marginBottom: 2,
        }}
      >
        {product.name}
      </ThemedText>

      {/* Bottom Section - Fixed at bottom */}
      <View style={{ position: 'absolute', bottom: 4, left: 6 }}>
        {/* Size/Unit Info */}
        {product.size && (
          <ThemedText
            className="text-xs"
            style={{ color: colorScheme === "dark" ? "#a3a3a3" : "#737373" }}
          >
            {product.size}
          </ThemedText>
        )}

        {/* Stock Status */}
        {isLowStock && !isOutOfStock && (
          <View className="flex-row items-center" style={{ marginTop: 2 }}>
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

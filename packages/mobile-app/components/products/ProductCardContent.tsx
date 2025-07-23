//  "ProductCardContent.tsx"
//  metropolitan app
//  Created by Ahmet on 26.06.2025. Edited on 23.07.2025.

import { Product } from "@/context/ProductContext";
import { formatPrice } from "@/core/utils";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { ColorSchemeName, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../ThemedText";

interface ProductCardContentProps {
  product: Product;
  categoryName?: string;
  colorScheme: ColorSchemeName;
  colors: any;
  isOutOfStock: boolean;
  isLowStock: boolean;
  handleAddToCart: (e: any) => void;
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
    <View className="p-3">
      {/* Category */}
      <ThemedText
        className="text-xs font-medium mb-1"
        style={{
          color: colors.mediumGray,
        }}
        numberOfLines={1}
      >
        {categoryName || product.category}
      </ThemedText>

      {/* Product Name */}
      <ThemedText
        className="text-sm font-semibold mb-3"
        numberOfLines={2}
        style={{
          lineHeight: 18,
          height: 36,
          color: colorScheme === 'dark' ? '#fff' : '#000',
        }}
      >
        {product.name}
      </ThemedText>

      {/* Price and Add to Cart Badge - Bottom */}
      <TouchableOpacity
        className="flex-row items-center justify-between px-3 py-2"
        style={{
          backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f8f8f8',
          borderRadius: 12,
          opacity: isOutOfStock ? 0.6 : 1,
        }}
        onPress={handleAddToCart}
        disabled={isOutOfStock}
        activeOpacity={0.8}
      >
        {/* Price */}
        <ThemedText
          className="text-lg font-bold"
          style={{
            color: colors.tint,
          }}
        >
          {formatPrice(product.price, product.currency)}
        </ThemedText>

        {/* Add Button */}
        <View className="flex-row items-center">
          <Ionicons 
            name="add" 
            size={16} 
            color={isOutOfStock ? colors.mediumGray : colors.tint} 
          />
          <ThemedText
            className="text-sm font-medium ml-1"
            style={{ 
              color: isOutOfStock ? colors.mediumGray : colors.tint,
            }}
          >
            {t("common.add")}
          </ThemedText>
        </View>
      </TouchableOpacity>

      {/* Low stock indicator */}
      {isLowStock && !isOutOfStock && (
        <ThemedText
          className="text-xs font-medium mt-2"
          style={{
            color: '#f59e0b',
            textAlign: 'center',
          }}
        >
          {t("product.low_stock")}
        </ThemedText>
      )}
    </View>
  );
};

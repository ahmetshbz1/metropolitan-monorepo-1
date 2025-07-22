//  "ProductCardContent.tsx"
//  metropolitan app
//  Created by Ahmet on 26.06.2025. Edited on 19.07.2025.

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
        className="text-sm font-semibold mb-2"
        numberOfLines={2}
        style={{
          lineHeight: 18,
          height: 36,
          color: colorScheme === 'dark' ? '#fff' : '#000',
        }}
      >
        {product.name}
      </ThemedText>

      {/* Price and Add to Cart */}
      <View className="flex-row justify-between items-center">
        <View className="flex-1">
          <ThemedText
            className="text-lg font-bold"
            style={{
              color: colors.tint,
            }}
          >
            {formatPrice(product.price, product.currency)}
          </ThemedText>
        </View>

        {/* Add to Cart Button - Clean style */}
        <TouchableOpacity
          className="flex-row items-center justify-center px-3 py-1.5 rounded-lg ml-2"
          style={{
            backgroundColor: isOutOfStock ? colors.lightGray : colors.tint,
            opacity: isOutOfStock ? 0.5 : 1,
          }}
          onPress={handleAddToCart}
          disabled={isOutOfStock}
        >
          <Ionicons name="add" size={16} color={isOutOfStock ? colors.darkGray : "#fff"} />
          <ThemedText
            className="text-xs font-medium ml-1"
            style={{ color: isOutOfStock ? colors.darkGray : "#fff" }}
          >
            {t("common.add")}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

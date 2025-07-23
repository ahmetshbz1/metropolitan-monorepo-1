//  "ProductCardContent.tsx"
//  metropolitan app
//  Created by Ahmet on 26.06.2025. Edited on 23.07.2025.

import { formatPrice } from "@/core/utils";
import React from "react";
import { useTranslation } from "react-i18next";
import { ColorSchemeName, View } from "react-native";
import { ThemedText } from "../ThemedText";
import { AddToCartButton } from "./AddToCartButton";

interface ProductCardContentProps {
  product: any;
  categoryName?: string;
  colorScheme: ColorSchemeName;
  colors: any;
  isOutOfStock: boolean;
  isLowStock: boolean;
  handleAddToCart: (e: any) => Promise<void>;
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
    <View 
      className={`
        p-3
        ${colorScheme === 'dark' ? 'bg-neutral-900' : 'bg-white'}
      `}
    >
      {/* Category Badge */}
      <View className="mb-2">
        <View 
          className={`
            self-start px-2 py-1 rounded-full
            ${colorScheme === 'dark' ? 'bg-neutral-800' : 'bg-gray-100'}
          `}
        >
          <ThemedText
            className="text-xs font-medium uppercase tracking-wide"
            style={{
              color: colors.tint,
              fontSize: 10,
            }}
            numberOfLines={1}
          >
            {categoryName || product.category}
          </ThemedText>
        </View>
      </View>

      {/* Product Name */}
      <ThemedText
        className="text-base font-bold mb-4"
        numberOfLines={2}
        style={{
          lineHeight: 20,
          height: 40,
          color: colorScheme === 'dark' ? '#fff' : '#1a1a1a',
          letterSpacing: -0.2,
        }}
      >
        {product.name}
      </ThemedText>

      {/* Price and Add to Cart Badge - Bottom */}
      <AddToCartButton
        onPress={handleAddToCart}
        disabled={isOutOfStock}
        colorScheme={colorScheme}
        colors={colors}
        price={formatPrice(product.price, product.currency)}
        currency={product.currency}
      />

      {/* Stock Status Indicators */}
      {isLowStock && !isOutOfStock && (
        <View className="mt-3 flex-row items-center justify-center">
          <View className="w-2 h-2 bg-amber-500 rounded-full mr-2" />
          <ThemedText
            className="text-xs font-semibold text-amber-500"
            style={{ letterSpacing: 0.3 }}
          >
            {t("product.low_stock")}
          </ThemedText>
        </View>
      )}
    </View>
  );
};

//  "ProductCardContent.tsx"
//  metropolitan app
//  Created by Ahmet on 26.06.2025. Edited on 23.07.2025.

import { formatPrice } from "@/core/utils";
import { useToast } from "@/hooks/useToast";
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
  const { showToast } = useToast();

  const handleNotifyMe = async () => {
    showToast(
      t("product_detail.purchase.notify_success_message", {
        productName: product.name,
      }),
      "success"
    );
  };

  return (
    <View className="p-3 bg-white dark:bg-neutral-900">
      {/* Category and Brand Badges */}
      <View className="mb-2 flex-row gap-2">
        {/* Category Badge */}
        <View className="self-start px-2 py-1 rounded-full bg-gray-100 dark:bg-neutral-800">
          <ThemedText
            className="text-xs font-medium uppercase tracking-wide"
            style={{
              color: colorScheme === "dark" ? colors.mediumGray : "#6b7280",
              fontSize: 10,
            }}
            numberOfLines={1}
          >
            {categoryName || product.category}
          </ThemedText>
        </View>

        {/* Brand Badge */}
        {product.brand && (
          <View className="self-start px-2 py-1 rounded-full bg-gray-100 dark:bg-neutral-800">
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
      </View>

      {/* Product Name */}
      <ThemedText
        className="text-base font-bold mb-4"
        numberOfLines={2}
        style={{
          lineHeight: 20,
          height: 40,
          color: colorScheme === "dark" ? "#fff" : "#1a1a1a",
          letterSpacing: -0.2,
        }}
      >
        {product.name}
      </ThemedText>

      {/* Price and Add to Cart Badge - Bottom */}
      <AddToCartButton
        onPress={isOutOfStock ? handleNotifyMe : handleAddToCart}
        disabled={false}
        colorScheme={colorScheme}
        colors={colors}
        price={formatPrice(product.price, product.currency)}
        outOfStock={isOutOfStock}
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

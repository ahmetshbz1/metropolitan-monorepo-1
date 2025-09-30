//  "ProductListItem.tsx"
//  metropolitan app
//  Created by Ahmet on 30.09.2025.

import { ThemedText } from "@/components/ThemedText";
import { Product } from "@/context/ProductContext";
import { useProductCard } from "@/hooks/useProductCard";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useNavigationProtection } from "@/hooks/useNavigationProtection";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { HapticIconButton } from "../HapticButton";
import { formatPrice } from "@/core/utils";

interface ProductListItemProps {
  product: Product;
}

export const ProductListItem = React.memo<ProductListItemProps>(function ProductListItem({
  product,
}) {
  const {
    colors,
    colorScheme,
    isLowStock,
    isOutOfStock,
    handleAddToCart,
  } = useProductCard(product);
  const { t } = useTranslation();
  const router = useRouter();
  const { push: safePush } = useNavigationProtection({ debounceTime: 700 });

  const handlePress = () => {
    safePush(`/product/${product.id}`);
  };

  return (
    <View className="mx-4 mb-3">
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        className="flex-row overflow-hidden border"
        style={{
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          shadowColor: colorScheme === "dark" ? "#000" : colors.tint,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
          padding: 12,
          borderRadius: 20,
        }}
      >
        {/* Image */}
        <View
          style={{
            width: 80,
            height: 80,
            backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff',
            borderRadius: 8,
            position: 'relative',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
          }}
        >
          <Image
            source={{ uri: product.image }}
            style={{
              width: '85%',
              height: '85%',
            }}
            contentFit="contain"
            transition={400}
            cachePolicy="memory-disk"
          />
          {isOutOfStock && (
            <View
              className="absolute inset-0 items-center justify-center"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.6)", borderRadius: 8 }}
            >
              <ThemedText className="text-xs font-bold" style={{ color: '#fff' }}>
                {t("product.out_of_stock")}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={{ flex: 1, justifyContent: 'start' }}>
          {/* Product Name */}
          <ThemedText
            className="text-base font-semibold mb-0.5"
            numberOfLines={2}
            style={{
              color: colorScheme === "dark" ? "#ffffff" : "#000000",
            }}
          >
            {product.name}
          </ThemedText>

          {/* Brand and Size */}
          <ThemedText
            className="text-sm mb-1"
            style={{
              color: colors.mediumGray,
            }}
          >
            {product.brand} • {product.size}
          </ThemedText>

          {/* Bottom Row - Price and Stock */}
          <View className="flex-row items-center justify-between">
            {/* Price */}
            <ThemedText
              className="text-base font-bold"
              style={{
                color: colors.text,
              }}
            >
              {formatPrice(product.price, product.currency)}
            </ThemedText>

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

        {/* Add to Cart Button */}
        {!isOutOfStock && (
          <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 8 }}>
            <HapticIconButton
              onPress={handleAddToCart}
              className="rounded-full justify-center items-center"
              style={{
                backgroundColor: colors.primary,
                width: 36,
                height: 36,
              }}
            >
              <Ionicons
                name="add"
                size={20}
                color="#fff"
                style={{ fontWeight: 'bold' }}
              />
            </HapticIconButton>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
});
//  "ProductInfo.tsx"
//  metropolitan app
//  Created by Ahmet on 15.06.2025.

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { Product } from "@/context/ProductContext";
import { formatPrice } from "@/core/utils";
import { useColorScheme } from "@/hooks/useColorScheme";

interface ProductInfoProps {
  product: Product | null;
}

export function ProductInfo({ product }: ProductInfoProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  if (!product) {
    return null; // or a loading indicator
  }

  return (
    <ThemedView className="p-5 rounded-t-2xl -mt-5">
      <View className="flex-row justify-between items-center mb-4">
        <ThemedText className="text-2xl font-bold leading-8">
          {product.name}
        </ThemedText>
        <ThemedText className="text-sm" style={{ color: "#9E9E9E" }}>
          {t(`brands.${product.brand.toLowerCase()}`)}
        </ThemedText>
      </View>

      <View className="mb-4">
        <ThemedText className="text-3xl font-bold leading-9">
          {formatPrice(product.price, product.currency)}
        </ThemedText>
      </View>

      <View className="flex-row items-center mb-2.5">
        <Ionicons name="cube-outline" size={20} color={colors.text} />
        <ThemedText className="text-sm leading-6 ml-2">
          {product.stock > 0
            ? t("product_detail.stock_available", { count: product.stock })
            : t("product_detail.out_of_stock")}
        </ThemedText>
      </View>

      <View className="flex-row items-center mb-2.5">
        <Ionicons name="grid-outline" size={20} color={colors.text} />
        <ThemedText className="text-sm leading-6 ml-2">
          {t("product_detail.category", { category: product.category })}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

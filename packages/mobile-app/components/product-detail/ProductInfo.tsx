//  "ProductInfo.tsx"
//  metropolitan app
//  Created by Ahmet on 15.06.2025.

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { TextInput, View } from "react-native";

import { HapticIconButton } from "@/components/HapticButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { formatPrice } from "@/core/utils";
import { useColorScheme } from "@/hooks/useColorScheme";
import type { Product } from "@metropolitan/shared";

interface ProductInfoProps {
  product: Product | null;
  quantity: string;
  onQuantityChange: (text: string) => void;
  onQuantityBlur: () => void;
  onUpdateQuantity: (amount: number) => void;
}

export function ProductInfo({
  product,
  quantity,
  onQuantityChange,
  onQuantityBlur,
  onUpdateQuantity,
}: ProductInfoProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const numericQuantity = parseInt(quantity, 10) || 0;

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

      {/* Quantity Selector */}
      {product.stock > 0 && (
        <View className="mt-4">
          <ThemedText
            className="text-sm font-medium mb-2"
            style={{ color: colors.text }}
          >
            {t("product_detail.quantity")}
          </ThemedText>
          <View
            className="flex-row items-center rounded-2xl border-2 overflow-hidden self-start"
            style={{
              borderColor: colors.borderColor,
              backgroundColor: colors.card,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <HapticIconButton
              className="w-12 h-12 items-center justify-center"
              onPress={() => onUpdateQuantity(-1)}
              hapticType="light"
              disabled={numericQuantity <= 1}
            >
              <Ionicons
                name="remove"
                size={20}
                color={numericQuantity <= 1 ? colors.mediumGray : colors.text}
              />
            </HapticIconButton>
            <TextInput
              className="text-lg font-bold text-center"
              style={{
                color: colors.text,
                minWidth: 50,
                height: "100%",
                textAlignVertical: "center",
                paddingVertical: 0,
                includeFontPadding: false,
                lineHeight: 20,
                borderLeftWidth: 1,
                borderRightWidth: 1,
                borderColor: colors.borderColor,
                backgroundColor: colors.card,
              }}
              value={quantity}
              onChangeText={onQuantityChange}
              onBlur={onQuantityBlur}
              keyboardType="number-pad"
              maxLength={3}
              selectTextOnFocus
            />
            <HapticIconButton
              className="w-12 h-12 items-center justify-center"
              onPress={() => onUpdateQuantity(1)}
              hapticType="light"
              disabled={numericQuantity >= product.stock}
            >
              <Ionicons
                name="add"
                size={20}
                color={
                  numericQuantity >= product.stock
                    ? colors.mediumGray
                    : colors.text
                }
              />
            </HapticIconButton>
          </View>
        </View>
      )}
    </ThemedView>
  );
}

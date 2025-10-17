//  "suggested-products.tsx"
//  metropolitan app
//  Created by Ahmet on 17.10.2025.

import { useNavigation } from "expo-router";
import React, { useEffect, useState, useLayoutEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Text,
  View,
} from "react-native";

import { ProductGrid } from "@/components/products/ProductGrid";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Product } from "@metropolitan/shared";
import api from "@/core/api";
import { formatPrice } from "@/core/utils";

export default function SuggestedProductsScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];
  const { user } = useAuth();
  const { summary } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const MINIMUM_ORDER_AMOUNT = 200;
  const currentTotal = typeof summary?.totalAmount === "string"
    ? parseFloat(summary.totalAmount)
    : (summary?.totalAmount || 0);
  const remainingAmount = Math.max(0, MINIMUM_ORDER_AMOUNT - currentTotal);

  // Set header title
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("suggested_products.title"),
      headerBackTitle: "",
    } as any);
  }, [navigation, t]);

  const fetchSuggestedProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/products/suggestions?lang=${i18n.language}&limit=20`
      );

      if (response.data.success) {
        setProducts(response.data.data);
      }
    } catch (error) {
      console.error("Suggested products fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [i18n.language]);

  useEffect(() => {
    fetchSuggestedProducts();
  }, [fetchSuggestedProducts]);

  const renderHeader = useCallback(() => (
    <View className="px-4 pt-4 pb-2">
      <Text
        style={{ color: themeColors.text }}
        className="text-xl font-bold mb-1"
      >
        {t("suggested_products.title")}
      </Text>
      <Text
        style={{ color: themeColors.textSecondary }}
        className="text-sm mb-3"
      >
        {t("suggested_products.subtitle")}
      </Text>
    </View>
  ), [t, themeColors]);

  if (loading) {
    return (
      <ThemedView className="flex-1">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      {user?.userType === "individual" && remainingAmount > 0 && (
        <View
          style={{
            backgroundColor: themeColors.cardBackground,
            borderBottomWidth: 1,
            borderBottomColor: themeColors.border,
          }}
          className="px-4 py-3"
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text
              style={{ color: themeColors.text }}
              className="text-xs font-semibold"
            >
              {t("suggested_products.progress_title")}
            </Text>
            <Text
              style={{ color: themeColors.warning }}
              className="text-xs font-bold"
            >
              {formatPrice(remainingAmount, summary?.currency || "PLN")} {t("suggested_products.remaining")}
            </Text>
          </View>

          <View className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <View
              style={{
                width: `${Math.min((currentTotal / MINIMUM_ORDER_AMOUNT) * 100, 100)}%`,
                backgroundColor: themeColors.warning,
              }}
              className="absolute left-0 top-0 bottom-0 rounded-full"
            />
          </View>

          <Text
            style={{ color: themeColors.textSecondary }}
            className="text-xs mt-1.5"
          >
            {formatPrice(currentTotal, summary?.currency || "PLN")} / {formatPrice(MINIMUM_ORDER_AMOUNT, summary?.currency || "PLN")}
          </Text>
        </View>
      )}

      <ProductGrid
        products={products}
        ListHeaderComponent={renderHeader}
      />
    </ThemedView>
  );
}

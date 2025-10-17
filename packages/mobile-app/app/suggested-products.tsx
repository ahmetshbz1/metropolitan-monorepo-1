//  "suggested-products.tsx"
//  metropolitan app
//  Created by Ahmet on 17.10.2025.

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProductCard } from "@/components/products/ProductCard";
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
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  useEffect(() => {
    fetchSuggestedProducts();
  }, [i18n.language]);

  const fetchSuggestedProducts = async () => {
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
  };

  const renderHeader = () => (
    <View className="px-4 py-4">
      <Text
        style={{ color: themeColors.text }}
        className="text-2xl font-bold mb-2"
      >
        {t("suggested_products.title")}
      </Text>
      <Text
        style={{ color: themeColors.textSecondary }}
        className="text-base mb-4"
      >
        {t("suggested_products.subtitle")}
      </Text>

      {user?.userType === "individual" && remainingAmount > 0 && (
        <View
          style={{
            backgroundColor: themeColors.warning + "15",
            borderColor: themeColors.warning,
          }}
          className="p-4 rounded-xl border mb-4"
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text
              style={{ color: themeColors.text }}
              className="text-sm font-semibold"
            >
              {t("suggested_products.progress_title")}
            </Text>
            <Text
              style={{ color: themeColors.warning }}
              className="text-sm font-bold"
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
            className="text-xs mt-2"
          >
            {formatPrice(currentTotal, summary?.currency || "PLN")} / {formatPrice(MINIMUM_ORDER_AMOUNT, summary?.currency || "PLN")}
          </Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <ThemedView className="flex-1">
        <View
          style={{
            paddingTop: insets.top,
            backgroundColor: themeColors.background,
          }}
          className="flex-row items-center px-4 py-3 border-b"
        >
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 p-2 -ml-2"
          >
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={{ color: themeColors.text }} className="text-lg font-semibold">
            {t("suggested_products.title")}
          </Text>
        </View>

        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <View
        style={{
          paddingTop: insets.top,
          backgroundColor: themeColors.background,
          borderBottomColor: themeColors.border,
        }}
        className="flex-row items-center px-4 py-3 border-b"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-3 p-2 -ml-2"
        >
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={{ color: themeColors.text }} className="text-lg font-semibold">
          {t("suggested_products.title")}
        </Text>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductCard product={item} />}
        numColumns={2}
        contentContainerStyle={{ paddingBottom: 20 }}
        columnWrapperStyle={{ paddingHorizontal: 16, gap: 12 }}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

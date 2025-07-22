//  "favorites.tsx"
//  metropolitan app
//  Created by Ahmet on 25.06.2025.

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { BaseButton } from "@/components/base/BaseButton";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductGridSkeleton } from "@/components/products/ProductGridSkeleton";
import { ThemedText } from "@/components/ThemedText";
import { ErrorState } from "@/components/ui/ErrorState";
import Colors from "@/constants/Colors";
import { useFavorites } from "@/context/FavoritesContext";
import { useColorScheme } from "@/hooks/useColorScheme";

const EmptyFavorites = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View className="flex-1 justify-center items-center p-5">
      <Ionicons
        name="heart-dislike-outline"
        size={80}
        color={colors.mediumGray}
      />
      <ThemedText className="text-xl font-bold mt-5 text-center">
        {t("favorites.empty.title")}
      </ThemedText>
      <ThemedText
        className="text-base text-center mt-2.5 mb-8"
        style={{ color: "#888" }}
      >
        {t("favorites.empty.subtitle")}
      </ThemedText>
      <BaseButton
        variant="primary"
        size="medium"
        title={t("favorites.empty.browse_button")}
        onPress={() => router.push("/(tabs)/products")}
        hapticType="light"
        style={{ paddingHorizontal: 24 }}
      />
    </View>
  );
};

export default function FavoritesScreen() {
  const { favorites, isLoading, error, reloadFavorites } = useFavorites();

  const handleRefresh = useCallback(() => {
    reloadFavorites();
  }, [reloadFavorites]);

  const showErrorOverlay = !!(error && favorites.length === 0);
  const showSkeleton = isLoading && favorites.length === 0;

  const renderContent = () => {
    if (showSkeleton) {
      return (
        <View className="flex-1">
          <ProductGridSkeleton />
        </View>
      );
    }

    if (!isLoading && !error && favorites.length === 0) {
      return <EmptyFavorites />;
    }

    return (
      <ProductGrid
        products={favorites}
        onRefresh={handleRefresh}
        refreshing={isLoading}
        contentContainerStyle={{ padding: 10 }}
      />
    );
  };

  return (
    <View className="flex-1">
      <View className="flex-1">
        {renderContent()}
        {showErrorOverlay && (
          <ErrorState message={error as string} onRetry={handleRefresh} />
        )}
      </View>
    </View>
  );
}

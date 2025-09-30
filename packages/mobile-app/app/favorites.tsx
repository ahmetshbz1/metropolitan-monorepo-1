//  "favorites.tsx"
//  metropolitan app
//  Created by Ahmet on 25.06.2025.

import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import React, { useCallback, useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { BaseButton } from "@/components/base/BaseButton";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductList } from "@/components/products/ProductList";
import { ProductGridSkeleton } from "@/components/products/ProductGridSkeleton";
import { ThemedText } from "@/components/ThemedText";
import { ErrorState } from "@/components/ui/ErrorState";
import Colors from "@/constants/Colors";
import { useFavorites } from "@/context/FavoritesContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { HapticIconButton } from "@/components/HapticButton";

type ViewMode = 'grid' | 'list';

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
        size="small"
        title={t("favorites.empty.browse_button")}
        onPress={() => router.push("/(tabs)/products")}
        style={{ paddingHorizontal: 24 }}
      />
    </View>
  );
};

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { favorites, isLoading, error, reloadFavorites } = useFavorites();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Header title'ı ayarla
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("favorites.title"),
    });
  }, [navigation, t]);

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

    if (viewMode === 'list') {
      return (
        <ProductList
          products={favorites}
          onRefresh={handleRefresh}
          refreshing={isLoading}
        />
      );
    }

    return (
      <ProductGrid
        products={favorites}
        onRefresh={handleRefresh}
        refreshing={isLoading}
      />
    );
  };

  return (
    <View className="flex-1">
      {/* View Mode Toggle */}
      {favorites.length > 0 && !showSkeleton && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            paddingHorizontal: 16,
            paddingVertical: 12,
            gap: 8,
            backgroundColor: colors.background,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <HapticIconButton
            onPress={() => setViewMode('grid')}
            style={{
              padding: 8,
              backgroundColor: viewMode === 'grid' ? colors.tint + '20' : colors.cardBackground,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: viewMode === 'grid' ? colors.tint : colors.border,
            }}
          >
            <Ionicons
              name="grid-outline"
              size={22}
              color={viewMode === 'grid' ? colors.tint : colors.text}
            />
          </HapticIconButton>
          <HapticIconButton
            onPress={() => setViewMode('list')}
            style={{
              padding: 8,
              backgroundColor: viewMode === 'list' ? colors.tint + '20' : colors.cardBackground,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: viewMode === 'list' ? colors.tint : colors.border,
            }}
          >
            <Ionicons
              name="list-outline"
              size={22}
              color={viewMode === 'list' ? colors.tint : colors.text}
            />
          </HapticIconButton>
        </View>
      )}

      <View className="flex-1">
        {renderContent()}
        {showErrorOverlay && (
          <ErrorState message={error as string} onRetry={handleRefresh} />
        )}
      </View>
    </View>
  );
}

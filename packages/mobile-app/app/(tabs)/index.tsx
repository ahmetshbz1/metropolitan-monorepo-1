//  "index.tsx"
//  metropolitan app
//  Created by Ahmet on 13.06.2025.

import { BaseButton } from "@/components/base/BaseButton";
import { useFocusEffect } from "@react-navigation/native";
import { Link } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView, View } from "react-native";

import { HomeSlider } from "@/components/home/HomeSlider";
import { HomeSliderSkeleton } from "@/components/home/HomeSliderSkeleton";
import { ProductSection } from "@/components/home/ProductSection";
import { ProductSectionSkeleton } from "@/components/home/ProductSectionSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import Colors from "@/constants/Colors";
import { useProducts } from "@/context/ProductContext";
import { useNotifications } from "@/context/NotificationContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useImagePreload } from "@/hooks/useImagePreload";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { useScrollToTop } from "./_layout";

const MemoizedHomeScreenContent = React.memo(function HomeScreenContent() {
  const { products } = useProducts();
  const { t } = useTranslation();
  useColorScheme();

  const { featuredProducts, weeklyProducts, bestSellers, newArrivals } =
    useMemo(() => {
      return {
        featuredProducts: products.slice(0, 6),
        weeklyProducts: products.slice(6, 12),
        bestSellers: products.slice(12, 18),
        newArrivals: products.slice(18, 24),
      };
    }, [products]);

  return (
    <>
      <HomeSlider />
      <ProductSection
        title={t("home.featured_products")}
        products={featuredProducts}
      />
      <ProductSection
        title={t("home.weekly_products")}
        products={weeklyProducts}
      />
      <ProductSection title={t("home.bestsellers")} products={bestSellers} />
      <ProductSection title={t("home.new_arrivals")} products={newArrivals} />

      <View className="mt-6 px-2.5">
        <Link href="/(tabs)/products" asChild>
          <BaseButton
            variant="primary"
            size="small"
            title={t("home.see_all_products")}
            fullWidth
            style={{ marginTop: 8, marginBottom: 24 }}
          />
        </Link>
      </View>
    </>
  );
});

function HomeScreenSkeleton() {
  return (
    <>
      <HomeSliderSkeleton />
      <View className="pt-4">
        <ProductSectionSkeleton />
        <ProductSectionSkeleton />
        <ProductSectionSkeleton />
      </View>
    </>
  );
}

export default function HomeScreen() {
  const { paddingBottom } = useTabBarHeight();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const {
    products,
    loadingProducts,
    error,
    refreshAllProducts,
    fetchCategories,
  } = useProducts();
  const { refreshUnreadCount } = useNotifications();

  const { registerScrollHandler, unregisterScrollHandler } = useScrollToTop();
  const scrollViewRef = useRef<ScrollView>(null);
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const imageUrls = useMemo(
    () => products.slice(0, 24).map((p) => p.image).filter(Boolean),
    [products]
  );

  // Preload images with optimized settings
  useImagePreload(imageUrls, {
    enabled: !loadingProducts && products.length > 0,
    highPriorityCount: 6,
    batchSize: 4,
    delayBetweenBatches: 150,
  });

  useEffect(() => {
    const scrollToTop = () => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    };

    registerScrollHandler("index", scrollToTop);

    return () => {
      unregisterScrollHandler("index");
    };
  }, [registerScrollHandler, unregisterScrollHandler]);

  useFocusEffect(
    useCallback(() => {
      setIsRefreshing(false);
      // Ana sayfaya her focus olunduğunda bildirim sayısını güncelle
      refreshUnreadCount();
    }, [refreshUnreadCount])
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshAllProducts();
      await fetchCategories();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshAllProducts, fetchCategories]);

  const showSkeleton = loadingProducts && products.length === 0;
  const showErrorOverlay = !!(
    error &&
    products.length === 0 &&
    !loadingProducts
  );

  return (
    <View className="flex-1">
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: 10,
          paddingHorizontal: 6,
          paddingBottom,
        }}
        scrollEnabled={!showErrorOverlay}
        nestedScrollEnabled={true}
        removeClippedSubviews={true}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.tint}
          />
        }
      >
        {showSkeleton || showErrorOverlay ? (
          <HomeScreenSkeleton />
        ) : (
          <MemoizedHomeScreenContent />
        )}
      </ScrollView>
      {showErrorOverlay && (
        <ErrorState message={error as string} onRetry={handleRefresh} />
      )}
    </View>
  );
}

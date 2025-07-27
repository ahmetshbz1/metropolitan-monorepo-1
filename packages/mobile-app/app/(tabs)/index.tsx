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
import { useColorScheme } from "@/hooks/useColorScheme";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { useScrollToTop } from "./_layout";

const MemoizedHomeScreenContent = React.memo(function HomeScreenContent() {
  const { products } = useProducts();
  const { t } = useTranslation();
  useColorScheme();

  // Ana sayfa sadece normal kategorileri gösterir - arama yok
  const { featuredProducts, weeklyProducts, bestSellers, newArrivals } =
    useMemo(() => {
      return {
        featuredProducts: products.slice(0, 4),
        weeklyProducts: products.slice(2, 6),
        bestSellers: products.slice(4, 8),
        newArrivals: products.slice(1, 5),
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
    refreshProducts,
    fetchCategories,
    fetchProducts,
  } = useProducts();

  const { registerScrollHandler, unregisterScrollHandler } = useScrollToTop();
  const scrollViewRef = useRef<ScrollView>(null);
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  // Ana sayfa artık kendi arama state'ini kullanıyor - global search kaldırıldı

  // Scroll-to-top handler'ı kaydet
  useEffect(() => {
    const scrollToTop = () => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    };

    registerScrollHandler("index", scrollToTop);

    return () => {
      unregisterScrollHandler("index");
    };
  }, [registerScrollHandler, unregisterScrollHandler]);

  // Tab focus olduğunda refreshing state'ini sıfırla
  useFocusEffect(
    useCallback(() => {
      // Tab'a odaklanıldığında refreshing state'ini sıfırla
      setIsRefreshing(false);
    }, [])
  );

  useEffect(() => {
    if (products.length === 0 && !loadingProducts && !error) {
      fetchCategories();
      fetchProducts();
    }
  }, [products.length, loadingProducts, error, fetchCategories, fetchProducts]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshProducts();
      await fetchCategories();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshProducts, fetchCategories]);

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

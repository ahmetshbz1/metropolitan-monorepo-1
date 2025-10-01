//  "SimilarProducts.tsx"
//  metropolitan app
//  Created by Ahmet on 22.09.2025.

import React, { memo, useMemo, useCallback } from "react";
import { View, FlatList, Text, TouchableOpacity, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useProducts } from "@/context/ProductContext";
import { ProductCard } from "@/components/products/ProductCard";
import { ThemedText } from "@/components/ThemedText";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import type { Product } from "@metropolitan/shared";

interface SimilarProductsProps {
  currentProduct: Product;
}

// Memo optimized component
export const SimilarProducts = memo<SimilarProductsProps>(function SimilarProducts({
  currentProduct,
}) {
  const { products } = useProducts();
  const { t } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const horizontalPadding = isTablet ? 12 : 10;
  const gap = isTablet ? 10 : 6;
  const cardWidth = isTablet ? 180 : 110;

  // Benzer ürünleri daha akıllıca filtreleme - multiple dependency memoization
  const similarProducts = useMemo(() => {
    if (!products?.length || !currentProduct) return [];

    return products
      .filter(
        (p) =>
          p.id !== currentProduct.id &&
          p.stock > 0 && // Stokta olan ürünler
          (p.category === currentProduct.category ||
            p.brand === currentProduct.brand)
      )
      .slice(0, 12); // Daha fazla ürün göster
  }, [products, currentProduct.id, currentProduct.category, currentProduct.brand]);

  // Early return optimization
  if (similarProducts.length === 0) {
    return null;
  }

  // Render function'ı cache'le - replace navigation kullan
  const renderItem = useCallback(({ item }: { item: Product }) => (
    <View style={{ width: cardWidth }}>
      <ProductCard product={item} replaceNavigation={true} />
    </View>
  ), [cardWidth]);

  // Navigation işlemini optimize et
  const handleViewAll = useCallback(() => {
    router.push({
      pathname: "/similar-products",
      params: {
        productId: currentProduct.id,
        category: currentProduct.category,
        brand: currentProduct.brand
      }
    });
  }, [router, currentProduct.id, currentProduct.category, currentProduct.brand]);

  return (
    <View className="mt-0 mb-4">
      <View className="flex-row justify-between items-center mb-3" style={{ paddingHorizontal: horizontalPadding }}>
        <ThemedText className="text-xl font-bold">
          {t("product_detail.similar_products", "Benzer Ürünler")}
        </ThemedText>
        <TouchableOpacity
          onPress={handleViewAll}
          className="flex-row items-center"
        >
          <ThemedText className="text-sm font-medium mr-1" style={{ color: "#9E9E9E" }}>
            {t("product_detail.view_all_similar", "Tümünü Gör")}
          </ThemedText>
          <Ionicons name="chevron-forward" size={16} color="#9E9E9E" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={similarProducts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          gap,
        }}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        initialNumToRender={8}
      />
    </View>
  );
}, (prevProps, nextProps) => {
  // Optimize memo comparison
  return (
    prevProps.currentProduct.id === nextProps.currentProduct.id &&
    prevProps.currentProduct.category === nextProps.currentProduct.category &&
    prevProps.currentProduct.brand === nextProps.currentProduct.brand
  );
});
//  "SimilarProducts.tsx"
//  metropolitan app
//  Created by Ahmet on 22.09.2025.

import React, { memo, useMemo, useCallback } from "react";
import { View, FlatList, Text, TouchableOpacity } from "react-native";
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
      .slice(0, 6); // İlk 6 ürün
  }, [products, currentProduct.id, currentProduct.category, currentProduct.brand]);

  // Early return optimization
  if (similarProducts.length === 0) {
    return null;
  }

  // Render function'ı cache'le
  const renderItem = useCallback(({ item }: { item: Product }) => (
    <ProductCard product={item} />
  ), []);

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
      <View className="flex-row justify-between items-center px-4 mb-3">
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
        numColumns={3}
        scrollEnabled={false}
        contentContainerStyle={{
          paddingHorizontal: 12,
          gap: 8,
        }}
        columnWrapperStyle={{
          gap: 8,
        }}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={6}
        updateCellsBatchingPeriod={50}
        initialNumToRender={6}
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
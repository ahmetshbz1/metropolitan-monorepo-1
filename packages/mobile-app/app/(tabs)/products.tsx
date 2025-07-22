//  "products.tsx"
//  metropolitan app
//  Created by Ahmet on 16.06.2025.

import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";

import { CategoryFilter } from "@/components/products/CategoryFilter";
import { ProductGrid, ProductGridRef } from "@/components/products/ProductGrid";
import { ProductGridSkeleton } from "@/components/products/ProductGridSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { useProducts } from "@/context/ProductContext";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { useProductsSearch, useScrollToTop } from "./_layout";

export default function ProductsScreen() {
  const {
    products,
    filteredProducts,
    loadingProducts,
    error,
    categories,
    selectedCategory,
    setSelectedCategory,
    setSearchQuery,
    refreshProducts,
    fetchProducts,
  } = useProducts();

  const { searchQuery } = useProductsSearch();
  const { registerScrollHandler, unregisterScrollHandler } = useScrollToTop();
  const { paddingBottom } = useTabBarHeight();
  const productGridRef = useRef<ProductGridRef>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Appbar'dan gelen search query'yi ProductContext'e senkronize et
  useEffect(() => {
    setSearchQuery(searchQuery);
  }, [searchQuery, setSearchQuery]);

  useEffect(() => {
    if (products.length === 0 && !loadingProducts && !error) {
      fetchProducts(selectedCategory);
    }
  }, [
    products.length,
    loadingProducts,
    error,
    selectedCategory,
    fetchProducts,
  ]);

  const handleCategoryPress = useCallback(
    (slug: string) => {
      const newCategory = selectedCategory === slug ? null : slug;
      setSelectedCategory(newCategory);
      fetchProducts(newCategory);
    },
    [selectedCategory, setSelectedCategory, fetchProducts]
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshProducts(selectedCategory);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedCategory, refreshProducts]);

  // Scroll-to-top handler'ı kaydet
  useEffect(() => {
    const scrollToTop = () => {
      productGridRef.current?.scrollToTop();
    };

    registerScrollHandler("products", scrollToTop);

    return () => {
      unregisterScrollHandler("products");
    };
  }, [registerScrollHandler, unregisterScrollHandler]);

  // Tab focus olduğunda refreshing state'ini sıfırla
  useFocusEffect(
    useCallback(() => {
      // Tab'a odaklanıldığında refreshing state'ini sıfırla
      setIsRefreshing(false);
    }, [])
  );

  const showSkeleton = loadingProducts && products.length === 0;
  const showErrorOverlay = !!(
    error &&
    products.length === 0 &&
    !loadingProducts
  );

  return (
    <View className="flex-1">
      {showSkeleton || showErrorOverlay ? (
        <>
          <CategoryFilter
            categories={categories}
            activeCategory={selectedCategory}
            onCategoryPress={handleCategoryPress}
          />
          <ProductGridSkeleton />
        </>
      ) : (
        <ProductGrid
          ref={productGridRef}
          products={filteredProducts}
          ListHeaderComponent={
            <CategoryFilter
              categories={categories}
              activeCategory={selectedCategory}
              onCategoryPress={handleCategoryPress}
            />
          }
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          contentContainerStyle={{
            paddingBottom,
          }}
        />
      )}

      {showErrorOverlay && (
        <ErrorState
          message={error as string}
          onRetry={() => fetchProducts(selectedCategory)}
        />
      )}
    </View>
  );
}

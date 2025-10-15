//  "products.tsx"
//  metropolitan app
//  Created by Ahmet on 16.06.2025.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { CategoryFilter } from "@/components/products/CategoryFilter";
import { ProductGrid, ProductGridRef } from "@/components/products/ProductGrid";
import { ProductGridSkeleton } from "@/components/products/ProductGridSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { useProducts, type Product } from "@/context/ProductContext";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { useProductsSearch, useScrollToTop } from "./_layout";
import { api } from "@/core/api";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

const sortProductsByStock = (products: Product[]): Product[] => {
  return [...products]
    .filter((product) => product && product.name && product.brand && product.category)
    .sort((a, b) => {
      if (a.stock > 0 && b.stock === 0) return -1;
      if (a.stock === 0 && b.stock > 0) return 1;
      return 0;
    });
};

const normalizeText = (text: string | undefined | null): string => {
  if (!text) {
    return "";
  }
  return text
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
};

export default function ProductsScreen() {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const { categories, products: allProducts } = useProducts();
  const { searchQuery, setSearchQuery } = useProductsSearch();
  const { registerScrollHandler, unregisterScrollHandler } = useScrollToTop();
  const { paddingBottom } = useTabBarHeight();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const gridRef = useRef<ProductGridRef>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategoryProducts = useCallback(
    async (categorySlug: string | null) => {
      if (categorySlug === null) {
        setCategoryProducts([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data } = await api.get("/products", {
          params: { lang, page: 1, limit: 1000, category: categorySlug },
        });

        if (data.success) {
          setCategoryProducts(sortProductsByStock(data.data));
        } else {
          setError("Ürünler yüklenemedi.");
        }
      } catch (e) {
        setError("Bir ağ hatası oluştu.");
      } finally {
        setIsLoading(false);
      }
    },
    [lang]
  );

  const handleCategoryPress = useCallback(
    async (slug: string | null) => {
      const newCategory = slug;
      setSelectedCategory(newCategory);
      await fetchCategoryProducts(newCategory);
    },
    [fetchCategoryProducts]
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchCategoryProducts(selectedCategory);
    setIsRefreshing(false);
  }, [selectedCategory, fetchCategoryProducts]);

  useEffect(() => {
    const scrollToTop = () => {
      gridRef.current?.scrollToTop();
    };
    registerScrollHandler("products", scrollToTop);
    return () => unregisterScrollHandler("products");
  }, [registerScrollHandler, unregisterScrollHandler]);

  const displayProducts = useMemo(() => {
    const baseProducts = selectedCategory === null ? allProducts : categoryProducts;

    if (!searchQuery.trim()) {
      return baseProducts;
    }

    const normalizedQuery = normalizeText(searchQuery.trim());
    return baseProducts.filter((product) => {
      if (!product) return false;

      const normalizedName = normalizeText(product.name);
      const normalizedBrand = normalizeText(product.brand);
      const normalizedCategory = normalizeText(product.category);

      return (
        normalizedName.includes(normalizedQuery) ||
        normalizedBrand.includes(normalizedQuery) ||
        normalizedCategory.includes(normalizedQuery)
      );
    });
  }, [allProducts, categoryProducts, selectedCategory, searchQuery]);


  const ListHeaderComponent = useMemo(
    () => (
      <CategoryFilter
        categories={categories}
        activeCategory={selectedCategory}
        onCategoryPress={handleCategoryPress}
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
        isLoading={isLoading}
      />
    ),
    [categories, selectedCategory, handleCategoryPress, setSearchQuery, searchQuery, isLoading]
  );

  if (error && displayProducts.length === 0) {
    return (
      <View className="flex-1">
        <ErrorState message={error} onRetry={handleRefresh} />
      </View>
    );
  }

  if (isLoading && displayProducts.length === 0 && !isRefreshing) {
    return <ProductGridSkeleton />;
  }

  return (
    <View className="flex-1">
      <ProductGrid
        ref={gridRef}
        products={displayProducts}
        ListHeaderComponent={ListHeaderComponent}
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
        contentContainerStyle={{ paddingBottom }}
      />
    </View>
  );
}

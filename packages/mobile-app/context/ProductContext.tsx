//  "ProductContext.tsx"
//  metropolitan app
//  Created by Ahmet on 03.06.2025.
//  Last Modified by Ahmet on 15.07.2025.

import { api } from "@/core/api";
import type {
  Category,
  ProductContextType,
} from "@metropolitan/shared";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useProductFiltering } from "./product/useProductFiltering";
import { useProductState } from "./product/useProductState";

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  // State and API logic hook
  const {
    products,
    loading: loadingProducts,
    error,
    hasMore: hasMoreProducts,
    fetchProducts,
    fetchMoreProducts,
    setProducts,
    setPage,
    setHasMore,
    setLoading,
  } = useProductState();

  // Filtering logic hook
  const {
    searchQuery,
    selectedCategory,
    filteredProducts,
    setSelectedCategory,
    setSearchQuery,
  } = useProductFiltering(products);

  // Category-specific state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const { data } = await api.get("/products/categories", {
        params: { lang },
      });
      if (data.success) {
        setCategories(data.data);
      }
    } catch (e) {
      // console.error('Failed to fetch categories', e);
    } finally {
      setLoadingCategories(false);
    }
  }, [lang]);

  const refreshProducts = useCallback(async () => {
    setLoading(true);
    setPage(1);
    setHasMore(true);
    await fetchProducts(selectedCategory);
    setLoading(false);
  }, [fetchProducts, selectedCategory, setLoading, setPage, setHasMore]);

  const handleFetchMore = () => {
    fetchMoreProducts(selectedCategory);
  };

  const value = useMemo(
    () => ({
      products,
      filteredProducts,
      categories,
      loadingProducts,
      loadingCategories,
      selectedCategory,
      searchQuery,
      hasMoreProducts,
      error,
      setSelectedCategory,
      setSearchQuery,
      fetchProducts,
      refreshProducts,
      fetchMoreProducts: handleFetchMore,
      fetchCategories,
    }),
    [
      products,
      filteredProducts,
      categories,
      loadingProducts,
      loadingCategories,
      selectedCategory,
      searchQuery,
      hasMoreProducts,
      error,
      setSelectedCategory,
      setSearchQuery,
      fetchProducts,
      refreshProducts,
      handleFetchMore,
      fetchCategories,
    ]
  );

  return (
    <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error("useProducts must be used within a ProductProvider");
  }
  return context;
};

// Re-export shared types for backward compatibility
export type { Product, Category } from "@metropolitan/shared";

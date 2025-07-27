// "useProductFiltering.ts"
// metropolitan-app
// Created by Ahmet on 15.07.2025.

import type { Product } from "@metropolitan/shared";
import { useCallback, useMemo, useState } from "react";

const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
};

export function useProductFiltering(products: Product[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products;
    }
    const normalizedQuery = normalizeText(searchQuery.trim());
    return products.filter((product) => {
      const normalizedName = normalizeText(product.name);
      const normalizedBrand = normalizeText(product.brand);
      const normalizedCategory = normalizeText(product.category);

      return (
        normalizedName.includes(normalizedQuery) ||
        normalizedBrand.includes(normalizedQuery) ||
        normalizedCategory.includes(normalizedQuery)
      );
    });
  }, [products, searchQuery]);

  const handleSetSelectedCategory = useCallback((slug: string | null) => {
    setSelectedCategory(slug);
  }, []);

  const handleSetSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return {
    searchQuery,
    selectedCategory,
    filteredProducts,
    setSelectedCategory: handleSetSelectedCategory,
    setSearchQuery: handleSetSearchQuery,
  };
}

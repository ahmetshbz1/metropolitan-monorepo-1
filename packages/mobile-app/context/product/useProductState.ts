// "useProductState.ts"
// metropolitan-app
// Created by Ahmet on 15.07.2025.

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/core/api";
import { Product } from "@metropolitan/shared/types/product";

const PAGE_SIZE = 20;
const MINIMUM_LOADING_TIME = 500;

export function useProductState() {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const fetchProducts = useCallback(
    async (categorySlug: string | null = null) => {
      setError(null);
      setLoading(true);
      setProducts([]);
      setPage(1);
      setHasMore(true);

      const startTime = Date.now();
      try {
        const params = { lang, page: 1, limit: PAGE_SIZE, category: categorySlug || undefined };
        const { data } = await api.get("/products", { params });

        if (data.success) {
          setProducts(data.data);
          setHasMore(data.data.length === PAGE_SIZE);
        } else {
          setHasMore(false);
          setError("Could not fetch products.");
        }
      } catch (e) {
        setError("A network error occurred.");
      } finally {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = MINIMUM_LOADING_TIME - elapsedTime;
        setTimeout(() => setLoading(false), Math.max(0, remainingTime));
      }
    },
    [lang]
  );

  const fetchMoreProducts = useCallback(
    async (categorySlug: string | null) => {
      if (loading || !hasMore) return;

      const nextPage = page + 1;
      setLoading(true);
      try {
        const params = { lang, page: nextPage, limit: PAGE_SIZE, category: categorySlug || undefined };
        const { data } = await api.get("/products", { params });

        if (data.success) {
          setProducts((prev) => [...prev, ...data.data]);
          setHasMore(data.data.length === PAGE_SIZE);
          setPage(nextPage);
        } else {
          setHasMore(false);
        }
      } catch (e) {
        setError("A network error occurred while fetching more products.");
      } finally {
        setLoading(false);
      }
    },
    [lang, page, loading, hasMore]
  );

  return {
    products,
    loading,
    error,
    hasMore,
    fetchProducts,
    fetchMoreProducts,
    setProducts, // For refresh
    setPage, // For refresh
    setHasMore, // For refresh
    setLoading, // For refresh
  };
}

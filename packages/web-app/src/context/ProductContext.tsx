"use client";

import { api } from "@/lib/api";
import { Product, Category } from "@metropolitan/shared";
import { ReactNode, createContext, useCallback, useContext, useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface ProductContextType {
  products: Product[];
  categories: Category[];
  loadingProducts: boolean;
  loadingCategories: boolean;
  error: string | null;
  getProductById: (id: string) => Product | undefined;
  fetchProducts: () => void;
  fetchCategories: () => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const { i18n } = useTranslation();
  // Backend expects simple language codes (tr|en|pl), not locale codes like tr-TR
  const rawLang = i18n.language?.split('-')[0] || 'tr';
  const supportedLanguages = ['tr', 'en', 'pl'];
  const lang = supportedLanguages.includes(rawLang) ? rawLang : 'tr';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      setError(null);
      const response = await api.get("/products", {
        params: { lang },
      });
      if (response.data.success) {
        setProducts(response.data.data);
      } else {
        setError("Failed to fetch products");
      }
    } catch (err: any) {
      console.error("Error fetching products:", err);
      setError(err.response?.data?.message || "Error fetching products");
    } finally {
      setLoadingProducts(false);
    }
  }, [lang]);

  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const response = await api.get("/products/categories", {
        params: { lang },
      });
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setLoadingCategories(false);
    }
  }, [lang]);

  const getProductById = useCallback((id: string) => {
    return products.find(product => product.id === id);
  }, [products]);

  // Fetch data on mount and language change
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [lang, fetchProducts, fetchCategories]);

  const value = useMemo(
    () => ({
      products,
      categories,
      loadingProducts,
      loadingCategories,
      error,
      getProductById,
      fetchProducts,
      fetchCategories,
    }),
    [
      products,
      categories,
      loadingProducts,
      loadingCategories,
      error,
      getProductById,
      fetchProducts,
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

//  "ProductContext.tsx"
//  metropolitan app
//  Created by Ahmet on 03.06.2025.

import { api } from "@/core/api";
import type { Category, Product } from "@metropolitan/shared";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";

interface ProductContextType {
  products: Product[];
  categories: Category[];
  loadingProducts: boolean;
  loadingCategories: boolean;
  error: string | null;
  fetchAllProducts: () => Promise<void>;
  refreshAllProducts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const sortProductsByStock = (products: Product[]): Product[] => {
  return [...products].sort((a, b) => {
    if (a.stock > 0 && b.stock === 0) return -1;
    if (a.stock === 0 && b.stock > 0) return 1;
    return 0;
  });
};

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const { user, isGuest } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllProducts = useCallback(async () => {
    setError(null);
    setLoadingProducts(true);

    try {
      const { data } = await api.get("/products", {
        params: { lang, page: 1, limit: 1000 },
      });

      if (data.success) {
        const sortedProducts = sortProductsByStock(data.data);
        setProducts(sortedProducts);
      } else {
        setError("Could not fetch products.");
      }
    } catch (e) {
      setError("A network error occurred.");
    } finally {
      setLoadingProducts(false);
    }
  }, [lang]);

  const refreshAllProducts = useCallback(async () => {
    await fetchAllProducts();
  }, [fetchAllProducts]);

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
      // Error silently
    } finally {
      setLoadingCategories(false);
    }
  }, [lang]);

  useEffect(() => {
    fetchAllProducts();
    fetchCategories();
  }, [fetchAllProducts, fetchCategories]);

  useEffect(() => {
    refreshAllProducts();
  }, [user?.id, user?.userType, isGuest]);

  const value = useMemo(
    () => ({
      products,
      categories,
      loadingProducts,
      loadingCategories,
      error,
      fetchAllProducts,
      refreshAllProducts,
      fetchCategories,
    }),
    [
      products,
      categories,
      loadingProducts,
      loadingCategories,
      error,
      fetchAllProducts,
      refreshAllProducts,
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

export type { Product, Category } from "@metropolitan/shared";

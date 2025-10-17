//  "similar-products.tsx"
//  metropolitan app
//  Created by Ahmet on 22.09.2025.

import React, { useMemo, useLayoutEffect, useState, useEffect } from "react";
import { ThemedView } from "@/components/ThemedView";
import { useTranslation } from "react-i18next";
import { useProducts } from "@/context/ProductContext";
import { ProductGrid } from "@/components/products/ProductGrid";
import { useLocalSearchParams } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import api from "@/core/api";
import type { Product } from "@metropolitan/shared";

export default function SimilarProductsScreen() {
  const { t, i18n } = useTranslation();
  const { products } = useProducts();
  const { productId, category, brand } = useLocalSearchParams();
  const navigation = useNavigation();
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("product_detail.similar_products_page_title"),
    });
  }, [navigation, t]);

  // Suggestions endpoint'inden en az satan ürünleri çek
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await api.get(
          `/products/suggestions?lang=${i18n.language}&limit=20`
        );
        if (response.data.success) {
          setSuggestedProducts(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch suggested products:", error);
      }
    };

    fetchSuggestions();
  }, [i18n.language]);

  // Benzer ürünleri bul (aynı kategori veya marka)
  const similarProducts = useMemo(() => {
    return products
      .filter(
        (p) =>
          p.id !== productId &&
          p.stock > 0 &&
          (p.category === category || p.brand === brand)
      )
      .slice(0, 6); // İlk 6 ürün gerçekten benzer
  }, [products, productId, category, brand]);

  // Tüm ürünleri birleştir: İlk 6 benzer, sonrası suggestions
  const allProducts = useMemo(() => {
    // Suggestions'dan benzer ürünlerde olmayanları al
    const additionalSuggestions = suggestedProducts
      .filter((sp) =>
        sp.id !== productId &&
        !similarProducts.some((sim) => sim.id === sp.id)
      );

    return [...similarProducts, ...additionalSuggestions];
  }, [similarProducts, suggestedProducts, productId]);

  return (
    <ThemedView className="flex-1">
      <ProductGrid
        products={allProducts}
        replaceNavigation={true}
      />
    </ThemedView>
  );
}
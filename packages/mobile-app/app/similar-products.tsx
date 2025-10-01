//  "similar-products.tsx"
//  metropolitan app
//  Created by Ahmet on 22.09.2025.

import React, { useMemo, useLayoutEffect } from "react";
import { ThemedView } from "@/components/ThemedView";
import { useTranslation } from "react-i18next";
import { useProducts } from "@/context/ProductContext";
import { ProductGrid } from "@/components/products/ProductGrid";
import { useLocalSearchParams } from "expo-router";
import { useNavigation } from "@react-navigation/native";

export default function SimilarProductsScreen() {
  const { t } = useTranslation();
  const { products } = useProducts();
  const { productId, category, brand } = useLocalSearchParams();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("product_detail.similar_products_page_title"),
    });
  }, [navigation, t]);

  // Benzer ürünleri bul
  const similarProducts = useMemo(() => {
    return products
      .filter(
        (p) =>
          p.id !== productId &&
          p.stock > 0 &&
          (p.category === category || p.brand === brand)
      );
  }, [products, productId, category, brand]);

  // Az satılan ürünleri bul
  const poorSellers = useMemo(() => {
    return products
      .filter(
        (p) =>
          p.stock > 0 &&
          !similarProducts.includes(p) &&
          p.id !== productId
      )
      .sort((a, b) => b.stock - a.stock);
  }, [products, productId, similarProducts]);

  // Tüm ürünleri birleştir
  const allProducts = useMemo(() => {
    return [...similarProducts, ...poorSellers];
  }, [similarProducts, poorSellers]);

  return (
    <ThemedView className="flex-1">
      <ProductGrid
        products={allProducts}
        replaceNavigation={true}
      />
    </ThemedView>
  );
}
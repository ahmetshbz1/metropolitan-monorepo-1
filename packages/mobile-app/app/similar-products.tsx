//  "similar-products.tsx"
//  metropolitan app
//  Created by Ahmet on 22.09.2025.

import React, { useMemo } from "react";
import { FlatList, View } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { useTranslation } from "react-i18next";
import { useProducts } from "@/context/ProductContext";
import { ProductCard } from "@/components/products/ProductCard";
import { useLocalSearchParams } from "expo-router";
import type { Product } from "@metropolitan/shared";

import { useNavigation } from "@react-navigation/native";
import { useLayoutEffect } from "react";

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

  // İlk satır için gerçek benzer ürünler + geri kalanı için az satılanlar
  const combinedProducts = useMemo(() => {
    // 1. Benzer ürünleri bul (kategori veya marka eşleşmesi)
    const similarProducts = products
      .filter(
        (p) =>
          p.id !== productId &&
          p.stock > 0 &&
          (p.category === category || p.brand === brand)
      )
      .slice(0, 3); // İlk 3 benzer ürün

    // 2. Az satılan ürünleri bul (stok fazlası)
    const poorSellers = products
      .filter(
        (p) =>
          p.stock > 0 &&
          !similarProducts.includes(p) && // Benzer ürünlerde olmayanlar
          p.id !== productId
      )
      .sort((a, b) => b.stock - a.stock); // En çok stoklu (az satılan) ürünler önce

    // İlk satır benzer ürünler, geri kalanı az satılanlar
    return [...similarProducts, ...poorSellers];
  }, [products, productId, category, brand]);

  const renderItem = ({ item }: { item: Product }) => (
    <ProductCard product={item} replaceNavigation={true} />
  );

  return (
    <ThemedView className="flex-1">
      <FlatList
        data={combinedProducts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingVertical: 8,
          gap: 8,
        }}
        columnWrapperStyle={{
          gap: 8,
        }}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}
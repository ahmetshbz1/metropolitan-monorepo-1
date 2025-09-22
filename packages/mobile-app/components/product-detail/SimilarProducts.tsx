//  "SimilarProducts.tsx"
//  metropolitan app
//  Created by Ahmet on 22.09.2025.

import React, { useMemo } from "react";
import { View, FlatList, Text } from "react-native";
import { useProducts } from "@/context/ProductContext";
import { ProductCard } from "@/components/products/ProductCard";
import { ThemedText } from "@/components/ThemedText";
import { useTranslation } from "react-i18next";
import type { Product } from "@metropolitan/shared";

interface SimilarProductsProps {
  currentProduct: Product;
}

export const SimilarProducts: React.FC<SimilarProductsProps> = ({
  currentProduct,
}) => {
  const { products } = useProducts();
  const { t } = useTranslation();

  const similarProducts = useMemo(() => {
    return products
      .filter(
        (p) =>
          p.id !== currentProduct.id &&
          (p.category === currentProduct.category ||
            p.brand === currentProduct.brand)
      )
      .slice(0, 6);
  }, [products, currentProduct]);

  if (similarProducts.length === 0) {
    return null;
  }

  const renderItem = ({ item }: { item: Product }) => (
    <ProductCard product={item} />
  );

  return (
    <View className="mt-0 mb-4">
      <ThemedText className="text-xl font-bold px-4 mb-3">
        {t("product_detail.similar_products", "Benzer Ürünler")}
      </ThemedText>
      <FlatList
        data={similarProducts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        scrollEnabled={false}
        contentContainerStyle={{
          paddingHorizontal: 12,
          gap: 8,
        }}
        columnWrapperStyle={{
          gap: 8,
        }}
      />
    </View>
  );
};
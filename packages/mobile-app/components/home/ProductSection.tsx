//  "ProductSection.tsx"
//  metropolitan app
//  Created by Ahmet on 03.07.2025. Edited on 19.07.2025.

import React from "react";
import { FlatList, ListRenderItem, View, useWindowDimensions } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { Product } from "@/context/ProductContext";
import { ProductCard } from "../products/ProductCard";

interface ProductSectionProps {
  title: string;
  products: Product[];
}

function ProductSectionComponent({ title, products }: ProductSectionProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const horizontalPadding = isTablet ? 12 : 10;
  const gap = isTablet ? 10 : 6;
  const cardWidth = isTablet ? 180 : 110;

  const renderItem: ListRenderItem<Product> = ({ item }) => (
    <View style={{ width: cardWidth }}>
      <ProductCard product={item} />
    </View>
  );

  return (
    <View className="mt-6">
      <View className="mb-3" style={{ paddingHorizontal: horizontalPadding }}>
        <ThemedText type="subtitle" className="text-lg font-semibold">
          {title}
        </ThemedText>
      </View>

      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: horizontalPadding, gap }}
        removeClippedSubviews={true}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        updateCellsBatchingPeriod={50}
        windowSize={5}
      />
    </View>
  );
}

export const ProductSection = React.memo(ProductSectionComponent);

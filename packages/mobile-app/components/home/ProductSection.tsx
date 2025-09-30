//  "ProductSection.tsx"
//  metropolitan app
//  Created by Ahmet on 03.07.2025. Edited on 19.07.2025.

import React from "react";
import { FlatList, ListRenderItem, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { Product } from "@/context/ProductContext";
import { ProductCard } from "../products/ProductCard";

interface ProductSectionProps {
  title: string;
  products: Product[];
}

function ProductSectionComponent({ title, products }: ProductSectionProps) {
  const renderItem: ListRenderItem<Product> = ({ item }) => (
    <ProductCard product={item} />
  );

  return (
    <View className="mt-6">
      <View className="mb-4 px-1">
        <ThemedText type="subtitle" className="text-lg font-semibold">
          {title}
        </ThemedText>
      </View>

      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        scrollEnabled={false}
        contentContainerStyle={{ paddingHorizontal: 6, gap: 8 }}
        columnWrapperStyle={{ gap: 8 }}
        removeClippedSubviews={true}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        updateCellsBatchingPeriod={50}
        windowSize={5}
      />
    </View>
  );
}

export const ProductSection = React.memo(ProductSectionComponent);

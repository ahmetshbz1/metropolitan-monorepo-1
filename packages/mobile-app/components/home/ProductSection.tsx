//  "ProductSection.tsx"
//  metropolitan app
//  Created by Ahmet on 03.07.2025. Edited on 19.07.2025.

import React from "react";
import { View, useWindowDimensions } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { Product } from "@/context/ProductContext";
import { ProductGrid } from "../products/ProductGrid";

interface ProductSectionProps {
  title: string;
  products: Product[];
}

function ProductSectionComponent({ title, products }: ProductSectionProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const horizontalPadding = isTablet ? 12 : 10;
  const cardWidth = isTablet ? 180 : 120;

  return (
    <View className="mt-6">
      <View className="mb-3" style={{ paddingHorizontal: horizontalPadding }}>
        <ThemedText type="subtitle" className="text-lg font-semibold">
          {title}
        </ThemedText>
      </View>

      <ProductGrid
        products={products}
        horizontal
        scrollEnabled={true}
        cardWidth={cardWidth}
      />
    </View>
  );
}

export const ProductSection = React.memo(
  ProductSectionComponent,
  (prev, next) => prev.title === next.title && prev.products.length === next.products.length
);

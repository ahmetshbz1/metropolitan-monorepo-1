//  "ProductGridSkeleton.tsx"
//  metropolitan app
//  Modern skeleton loader for product grid

import React from "react";
import { FlatList, View, useWindowDimensions } from "react-native";
import { ProductCardSkeleton } from "./ProductCardSkeleton";

const SKELETON_COUNT = 9; // 3 columns x 3 rows (mobile), 4 columns x 2 rows (tablet)
const skeletonData = Array(SKELETON_COUNT).fill(0);

export function ProductGridSkeleton() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const numColumns = isTablet ? 4 : 3;
  const gap = isTablet ? 12 : 8;
  const horizontalPadding = isTablet ? 12 : 8;

  return (
    <FlatList
      data={skeletonData}
      renderItem={() => <ProductCardSkeleton />}
      keyExtractor={(_, index) => `skeleton-${index}`}
      key={`skeleton-grid-${numColumns}`}
      numColumns={numColumns}
      contentContainerStyle={{
        paddingHorizontal: horizontalPadding,
        paddingVertical: 12,
      }}
      columnWrapperStyle={{ gap, marginBottom: gap }}
      scrollEnabled={false}
    />
  );
}

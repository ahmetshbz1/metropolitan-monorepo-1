//  "ProductGridSkeleton.tsx"
//  metropolitan app
//  Created by Ahmet on 09.07.2025.

import { FlatList } from "react-native";
import { ProductCardSkeleton } from "./ProductCardSkeleton";

const SKELETON_COUNT = 8; // Number of skeleton cards to display
const skeletonData = Array(SKELETON_COUNT).fill(0);

export function ProductGridSkeleton() {
  return (
    <FlatList
      data={skeletonData}
      renderItem={() => <ProductCardSkeleton />}
      keyExtractor={(_, index) => `skeleton-${index}`}
      numColumns={2}
      contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 10 }}
      scrollEnabled={false} // Disable scrolling for the skeleton view
    />
  );
}

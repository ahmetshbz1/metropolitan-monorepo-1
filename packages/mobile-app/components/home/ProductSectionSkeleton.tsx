//  "ProductSectionSkeleton.tsx"
//  metropolitan app
//  Created by Ahmet on 28.06.2025.

import { View } from "react-native";
import { ProductCardSkeleton } from "../products/ProductCardSkeleton";
import ShimmerView from "../ui/ShimmerView";

const SKELETON_COUNT = 4;

export function ProductSectionSkeleton() {
  return (
    <View className="py-4">
      <ShimmerView
        style={{
          width: 200,
          height: 24,
          borderRadius: 6,
          marginBottom: 15,
          marginLeft: 14,
        }}
      />
      <View className="flex-row flex-wrap px-0.5">
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <ProductCardSkeleton key={`skeleton-${index}`} />
        ))}
      </View>
    </View>
  );
}

//  "ProductGridSkeleton.tsx"
//  metropolitan app
//  Created by Ahmet on 09.07.2025.

import React from "react";
import { FlatList, View, ScrollView } from "react-native";
import { ProductCardSkeleton } from "./ProductCardSkeleton";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

const SKELETON_COUNT = 9; // 3 columns x 3 rows
const skeletonData = Array(SKELETON_COUNT).fill(0);
const categorySkeletonData = Array(5).fill(0); // 5 category skeletons

export function ProductGridSkeleton() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <View className="flex-1">
      {/* Category Filter Skeleton */}
      <View className="py-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            alignItems: 'center'
          }}
          scrollEnabled={false}
        >
          {categorySkeletonData.map((_, index) => (
            <View
              key={`category-skeleton-${index}`}
              className="mr-3"
            >
              <View
                className="px-5 py-2.5 rounded-full"
                style={{
                  backgroundColor: colorScheme === "dark"
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(0, 0, 0, 0.03)",
                  width: 80 + (index % 2) * 20, // Vary widths: 80px or 100px
                  height: 36,
                }}
              />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Product Grid Skeleton */}
      <FlatList
        data={skeletonData}
        renderItem={() => <ProductCardSkeleton />}
        keyExtractor={(_, index) => `skeleton-${index}`}
        numColumns={3}
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingVertical: 8,
          gap: 8
        }}
        columnWrapperStyle={{ gap: 8 }}
        scrollEnabled={false}
      />
    </View>
  );
}
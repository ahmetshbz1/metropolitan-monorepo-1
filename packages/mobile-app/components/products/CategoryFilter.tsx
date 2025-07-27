//  "CategoryFilter.tsx"
//  metropolitan app
//  Created by Ahmet on 25.06.2025.

import React from "react";
import { ScrollView, View } from "react-native";

import { Category } from "@/context/ProductContext";
import { useHaptics } from "@/hooks/useHaptics";
import { CategoryFilterItem } from "./CategoryFilterItem";

interface CategoryFilterProps {
  categories: Category[];
  activeCategory: string | null;
  onCategoryPress: (slug: string) => void;
}

export function CategoryFilter({
  categories,
  activeCategory,
  onCategoryPress,
}: CategoryFilterProps) {
  const { triggerHaptic } = useHaptics();

  const handleCategoryPress = (slug: string) => {
    triggerHaptic("light");
    onCategoryPress(slug);
  };

  return (
    <View className="py-3 justify-center">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {categories.map((category) => (
          <CategoryFilterItem
            key={category.id}
            category={category}
            isActive={activeCategory === category.slug}
            onPress={handleCategoryPress}
          />
        ))}
      </ScrollView>
    </View>
  );
}

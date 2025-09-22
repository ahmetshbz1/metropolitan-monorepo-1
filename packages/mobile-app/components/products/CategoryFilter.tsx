//  "CategoryFilter.tsx"
//  metropolitan app
//  Created by Ahmet on 25.06.2025.

import React from "react";
import { ScrollView, View } from "react-native";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  const handleCategoryPress = (slug: string | null) => {
    triggerHaptic("light");
    onCategoryPress(slug === "all" ? null : slug);
  };

  // "Tümü" kategorisini manuel olarak ekle
  const allCategory: Category = {
    id: "all",
    name: t("categories.all"),
    slug: "all",
    description: "",
    image: "",
    productCount: 0,
  };

  const allCategories = [allCategory, ...categories];

  return (
    <View className="py-3">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          alignItems: 'center'
        }}
      >
        {allCategories.map((category) => (
          <CategoryFilterItem
            key={category.id}
            category={category}
            isActive={
              category.slug === "all"
                ? activeCategory === null
                : activeCategory === category.slug
            }
            onPress={handleCategoryPress}
          />
        ))}
      </ScrollView>
    </View>
  );
}
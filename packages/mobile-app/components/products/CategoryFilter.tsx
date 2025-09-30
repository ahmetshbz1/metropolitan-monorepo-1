//  "CategoryFilter.tsx"
//  metropolitan app
//  Created by Ahmet on 25.06.2025.

import React from "react";
import { ScrollView, View, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";

import { Category } from "@/context/ProductContext";
import { useHaptics } from "@/hooks/useHaptics";
import { CategoryFilterItem } from "./CategoryFilterItem";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

interface CategoryFilterProps {
  categories: Category[];
  activeCategory: string | null;
  onCategoryPress: (slug: string) => void;
  isLoading?: boolean;
}

export function CategoryFilter({
  categories,
  activeCategory,
  onCategoryPress,
  isLoading = false,
}: CategoryFilterProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { triggerHaptic } = useHaptics();
  const { t } = useTranslation();

  const handleCategoryPress = (slug: string | null) => {
    triggerHaptic();
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
      <View className="flex-row items-center">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            alignItems: 'center',
            flexGrow: 1,
          }}
          style={{ flex: 1 }}
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
        {isLoading && (
          <View style={{ paddingRight: 16 }}>
            <ActivityIndicator size="small" color={colors.tint} />
          </View>
        )}
      </View>
    </View>
  );
}
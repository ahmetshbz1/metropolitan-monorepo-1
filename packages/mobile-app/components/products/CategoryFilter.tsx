//  "CategoryFilter.tsx"
//  metropolitan app
//  Created by Ahmet on 25.06.2025.

import React, { useRef } from "react";
import { View, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

import { Category } from "@/context/ProductContext";
import { useHaptics } from "@/hooks/useHaptics";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { CategoryFilterBottomSheet } from "./CategoryFilterBottomSheet";

interface CategoryFilterProps {
  categories: Category[];
  activeCategory: string | null;
  onCategoryPress: (slug: string | null) => void;
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
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const handleOpenBottomSheet = () => {
    triggerHaptic();
    bottomSheetRef.current?.present();
  };

  const activeCategoryName =
    activeCategory === null
      ? t("categories.all")
      : categories.find((c) => c.slug === activeCategory)?.name ||
        t("categories.all");

  return (
    <>
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <TouchableOpacity
          onPress={handleOpenBottomSheet}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: colors.cardBackground,
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <Ionicons
              name="filter"
              size={20}
              color={colors.primary}
              style={{ marginRight: 10 }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.mediumGray,
                  marginBottom: 2,
                }}
              >
                {t("categories.category")}
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: colors.text,
                }}
                numberOfLines={1}
              >
                {activeCategoryName}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {isLoading && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
            <Ionicons
              name="chevron-down"
              size={20}
              color={colors.mediumGray}
            />
          </View>
        </TouchableOpacity>
      </View>

      <CategoryFilterBottomSheet
        ref={bottomSheetRef}
        categories={categories}
        activeCategory={activeCategory}
        onCategoryPress={onCategoryPress}
      />
    </>
  );
}

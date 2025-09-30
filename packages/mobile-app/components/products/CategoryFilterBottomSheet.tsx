//  "CategoryFilterBottomSheet.tsx"
//  metropolitan app
//  Created by Ahmet on 30.09.2025.

import React, { forwardRef, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

import { Category } from "@/context/ProductContext";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useHaptics } from "@/hooks/useHaptics";
import CustomBottomSheet from "@/components/CustomBottomSheet";

interface CategoryFilterBottomSheetProps {
  categories: Category[];
  activeCategory: string | null;
  onCategoryPress: (slug: string | null) => void;
}

export const CategoryFilterBottomSheet = forwardRef<
  BottomSheetModal,
  CategoryFilterBottomSheetProps
>(({ categories, activeCategory, onCategoryPress }, ref) => {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { triggerHaptic } = useHaptics();
  const { t } = useTranslation();

  const handleCategoryPress = useCallback(
    (slug: string | null) => {
      triggerHaptic();
      onCategoryPress(slug);
      if (ref && "current" in ref) {
        ref.current?.dismiss();
      }
    },
    [onCategoryPress, ref, triggerHaptic]
  );

  const allCategory: Category = useMemo(
    () => ({
      id: "all",
      name: t("categories.all"),
      slug: "all",
      description: "",
      image: "",
      productCount: 0,
    }),
    [t]
  );

  const allCategories = useMemo(
    () => [allCategory, ...categories],
    [allCategory, categories]
  );

  return (
    <CustomBottomSheet
      ref={ref}
      title={t("categories.select")}
      snapPoints={["50%", "75%"]}
      keepMounted
    >
      {allCategories.map((category) => {
        const isActive =
          category.slug === "all"
            ? activeCategory === null
            : activeCategory === category.slug;

        return (
          <TouchableOpacity
            key={category.id}
            onPress={() =>
              handleCategoryPress(
                category.slug === "all" ? null : category.slug
              )
            }
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingVertical: 16,
              backgroundColor: isActive ? `${colors.primary}15` : "transparent",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: isActive ? "700" : "500",
                  color: isActive ? colors.primary : colors.text,
                }}
              >
                {category.name}
              </Text>
              {category.productCount > 0 && (
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.mediumGray,
                    marginTop: 2,
                  }}
                >
                  {category.productCount} {t("categories.products")}
                </Text>
              )}
            </View>
            {isActive && (
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={colors.primary}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </CustomBottomSheet>
  );
});

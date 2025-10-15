//  "CategoryFilter.tsx"
//  metropolitan app
//  Created by Ahmet on 25.06.2025.

import React, { useRef, useState, useCallback, useEffect } from "react";
import { View, TouchableOpacity, Text, ActivityIndicator, TextInput } from "react-native";
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
  onSearchChange?: (query: string) => void;
  searchQuery?: string;
  isLoading?: boolean;
}

export function CategoryFilter({
  categories,
  activeCategory,
  onCategoryPress,
  onSearchChange,
  searchQuery = "",
  isLoading = false,
}: CategoryFilterProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const isDark = colorScheme === "dark";
  const { triggerHaptic } = useHaptics();
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const [localSearchValue, setLocalSearchValue] = useState(searchQuery);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const handleOpenBottomSheet = () => {
    triggerHaptic();
    bottomSheetRef.current?.present();
  };

  const handleSearchChange = useCallback(
    (text: string) => {
      setLocalSearchValue(text);

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        onSearchChange?.(text);
      }, 300);
    },
    [onSearchChange]
  );

  const handleClearSearch = useCallback(() => {
    triggerHaptic();
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    setLocalSearchValue("");
    onSearchChange?.("");
  }, [onSearchChange, triggerHaptic]);

  const activeCategoryName =
    activeCategory === null
      ? t("categories.all")
      : categories.find((c) => c.slug === activeCategory)?.name ||
        t("categories.all");

  return (
    <>
      <View
        style={{
          paddingHorizontal: 12,
          paddingTop: 12,
          paddingBottom: 8,
          gap: 10,
        }}
      >
        {/* Arama Input */}
        <View
          style={{
            backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: isDark ? "#2a2a2a" : "#e5e5e5",
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 14,
            height: 48,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isDark ? 0.3 : 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Ionicons
            name="search"
            size={20}
            color={colors.mediumGray}
            style={{ marginRight: 10 }}
          />
          <TextInput
            value={localSearchValue}
            onChangeText={handleSearchChange}
            placeholder={t("tabs.search_placeholder")}
            placeholderTextColor={colors.mediumGray}
            style={{
              flex: 1,
              fontSize: 15,
              color: colors.text,
              paddingVertical: 0,
            }}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {localSearchValue.length > 0 && (
            <TouchableOpacity
              onPress={handleClearSearch}
              style={{ padding: 4 }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.mediumGray}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Kategori Filtresi */}
        <TouchableOpacity
          onPress={handleOpenBottomSheet}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: isDark ? "#2a2a2a" : "#e5e5e5",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isDark ? 0.3 : 0.05,
            shadowRadius: 4,
            elevation: 2,
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
                  fontSize: 11,
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

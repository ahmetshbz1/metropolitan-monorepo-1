//  "CategoryFilter.tsx"
//  metropolitan app
//  Created by Ahmet on 25.06.2025.

import React, { useRef, useState, useCallback, useEffect } from "react";
import { View, TouchableOpacity, Text, TextInput, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import { Category } from "@/context/ProductContext";
import { useHaptics } from "@/hooks/useHaptics";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { zincColors } from "@/constants/colors/zincColors";

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
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localSearchValue, setLocalSearchValue] = useState(searchQuery);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

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

  const handleCategoryPress = useCallback(
    (slug: string | null) => {
      triggerHaptic();
      onCategoryPress(slug);
    },
    [onCategoryPress, triggerHaptic]
  );

  const allCategories = [
    { slug: null, name: t("categories.all") },
    ...categories,
  ];

  return (
    <View
      style={{
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      {/* Arama Input */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
        <View
          style={{
            backgroundColor: isDark ? zincColors[900] : zincColors[100],
            borderRadius: 12,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            height: 44,
          }}
        >
          <Ionicons
            name="search"
            size={18}
            color={isDark ? zincColors[500] : zincColors[400]}
          />
          <TextInput
            value={localSearchValue}
            onChangeText={handleSearchChange}
            placeholder={t("tabs.search_placeholder")}
            placeholderTextColor={isDark ? zincColors[500] : zincColors[400]}
            style={{
              flex: 1,
              fontSize: 15,
              color: isDark ? zincColors[50] : zincColors[900],
              paddingHorizontal: 10,
              paddingVertical: 0,
            }}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {localSearchValue.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} activeOpacity={0.7}>
              <Ionicons
                name="close-circle"
                size={18}
                color={isDark ? zincColors[500] : zincColors[400]}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Kategori Chip'leri */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 12,
          gap: 8,
        }}
      >
        {allCategories.map((category) => {
          const isActive = category.slug === activeCategory;
          return (
            <TouchableOpacity
              key={category.slug || "all"}
              onPress={() => handleCategoryPress(category.slug)}
              activeOpacity={0.7}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: isActive
                  ? colors.primary
                  : isDark
                  ? zincColors[900]
                  : zincColors[100],
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: isActive ? "600" : "500",
                  color: isActive
                    ? "#ffffff"
                    : isDark
                    ? zincColors[300]
                    : zincColors[700],
                }}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

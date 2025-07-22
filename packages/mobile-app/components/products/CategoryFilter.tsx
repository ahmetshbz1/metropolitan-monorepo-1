//  "CategoryFilter.tsx"
//  metropolitan app
//  Created by Ahmet on 25.06.2025.

import { useHaptics } from "@/hooks/useHaptics";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import Colors from "@/constants/Colors";
import { Category } from "@/context/ProductContext";
import { useColorScheme } from "@/hooks/useColorScheme";

interface CategoryFilterProps {
  categories: Category[];
  activeCategory: string | null;
  onCategoryPress: (slug: string) => void;
}

// Kategori slug'larına göre ikon mapping'i
const getCategoryIcon = (
  slug: string,
  name: string
): keyof typeof Ionicons.glyphMap => {
  const normalizedSlug = slug.toLowerCase();
  const normalizedName = name.toLowerCase();

  // Elektronik kategorileri
  if (
    normalizedSlug.includes("elektronik") ||
    normalizedSlug.includes("electronic") ||
    normalizedName.includes("elektronik") ||
    normalizedName.includes("electronic")
  ) {
    return "hardware-chip-outline";
  }

  // Telefon/Mobil kategorileri
  if (
    normalizedSlug.includes("telefon") ||
    normalizedSlug.includes("phone") ||
    normalizedSlug.includes("mobile") ||
    normalizedName.includes("telefon")
  ) {
    return "phone-portrait-outline";
  }

  // Bilgisayar kategorileri
  if (
    normalizedSlug.includes("bilgisayar") ||
    normalizedSlug.includes("computer") ||
    normalizedSlug.includes("laptop") ||
    normalizedName.includes("bilgisayar")
  ) {
    return "laptop-outline";
  }

  // Giyim kategorileri
  if (
    normalizedSlug.includes("giyim") ||
    normalizedSlug.includes("clothing") ||
    normalizedSlug.includes("fashion") ||
    normalizedName.includes("giyim")
  ) {
    return "shirt-outline";
  }

  // Ev kategorileri
  if (
    normalizedSlug.includes("ev") ||
    normalizedSlug.includes("home") ||
    normalizedSlug.includes("house") ||
    normalizedName.includes("ev")
  ) {
    return "home-outline";
  }

  // Spor kategorileri
  if (
    normalizedSlug.includes("spor") ||
    normalizedSlug.includes("sport") ||
    normalizedSlug.includes("fitness") ||
    normalizedName.includes("spor")
  ) {
    return "fitness-outline";
  }

  // Kitap kategorileri
  if (
    normalizedSlug.includes("kitap") ||
    normalizedSlug.includes("book") ||
    normalizedName.includes("kitap")
  ) {
    return "book-outline";
  }

  // Oyuncak kategorileri
  if (
    normalizedSlug.includes("oyuncak") ||
    normalizedSlug.includes("toy") ||
    normalizedName.includes("oyuncak")
  ) {
    return "game-controller-outline";
  }

  // Kozmetik kategorileri
  if (
    normalizedSlug.includes("kozmetik") ||
    normalizedSlug.includes("beauty") ||
    normalizedSlug.includes("cosmetic") ||
    normalizedName.includes("kozmetik")
  ) {
    return "flower-outline";
  }

  // Yiyecek kategorileri
  if (
    normalizedSlug.includes("yiyecek") ||
    normalizedSlug.includes("food") ||
    normalizedSlug.includes("gida") ||
    normalizedName.includes("yiyecek")
  ) {
    return "restaurant-outline";
  }

  // Varsayılan ikon
  return "apps-outline";
};

export function CategoryFilter({
  categories,
  activeCategory,
  onCategoryPress,
}: CategoryFilterProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
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
        {categories.map((cat) => {
          const isActive = activeCategory === cat.slug;
          const iconName = getCategoryIcon(cat.slug, cat.name);

          return (
            <TouchableOpacity
              key={cat.id}
              className="mr-4 items-center justify-center"
              style={{
                paddingVertical: 12,
                paddingHorizontal: 12,
                minWidth: 80,
                minHeight: 80,
              }}
              onPress={() => handleCategoryPress(cat.slug)}
              activeOpacity={0.7}
            >
              {/* Category Icon */}
              <Ionicons
                name={iconName}
                size={28}
                color={
                  isActive
                    ? colors.tint
                    : colorScheme === "dark"
                      ? "rgba(255, 255, 255, 0.6)"
                      : colors.mediumGray
                }
              />

              <ThemedText
                className="text-xs font-medium mt-2"
                style={{
                  color: isActive
                    ? colors.tint
                    : colorScheme === "dark"
                      ? "rgba(255, 255, 255, 0.8)"
                      : colors.text,
                  letterSpacing: -0.1,
                  textAlign: "center",
                }}
                numberOfLines={2}
              >
                {cat.name}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

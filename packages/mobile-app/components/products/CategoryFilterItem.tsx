//  "CategoryFilterItem.tsx"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import React from "react";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import Colors from "@/constants/Colors";
import { Category } from "@/context/ProductContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { getCategoryIcon } from "@/utils/categoryIcon";

interface CategoryFilterItemProps {
  category: Category;
  isActive: boolean;
  onPress: (slug: string) => void;
}

export function CategoryFilterItem({
  category,
  isActive,
  onPress,
}: CategoryFilterItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const iconName = getCategoryIcon(category.slug, category.name);

  return (
    <TouchableOpacity
      key={category.id}
      className="mr-4 items-center justify-center"
      style={{
        paddingVertical: 12,
        paddingHorizontal: 12,
        minWidth: 80,
        minHeight: 80,
      }}
      onPress={() => onPress(category.slug)}
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
        {category.name}
      </ThemedText>
    </TouchableOpacity>
  );
}

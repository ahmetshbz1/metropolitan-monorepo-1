//  "CategoryFilterItem.tsx"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import React from "react";
import { TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import Colors from "@/constants/Colors";
import { Category } from "@/context/ProductContext";
import { useColorScheme } from "@/hooks/useColorScheme";

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

  return (
    <TouchableOpacity
      key={category.id}
      className="mr-3"
      onPress={() => onPress(category.slug)}
      activeOpacity={0.7}
    >
      <View
        className="px-5 py-2.5 rounded-full"
        style={{
          backgroundColor: isActive
            ? colors.tint
            : colorScheme === "dark"
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.05)",
          borderWidth: isActive ? 0 : 1,
          borderColor: isActive
            ? "transparent"
            : colorScheme === "dark"
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.08)",
        }}
      >
        <ThemedText
          className="text-sm font-semibold"
          style={{
            color: isActive
              ? "#FFFFFF"
              : colorScheme === "dark"
                ? "rgba(255, 255, 255, 0.9)"
                : colors.text,
            letterSpacing: 0.2,
          }}
        >
          {category.name}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}
//  "SwipeActions.tsx"
//  metropolitan app
//  Created by Ahmet on 12.06.2025.

import { swipeConfig } from "@/constants/notifications.constants";
import { SwipeActionsProps } from "@/types/notifications.types";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { useTranslation } from "react-i18next";
import { Animated, Text, TouchableOpacity } from "react-native";

export function SwipeActions({ item, onDelete }: SwipeActionsProps) {
  const { t } = useTranslation();

  const renderRightActions = (
    progress: Animated.AnimatedAddition<number>,
    dragX: Animated.AnimatedAddition<number>
  ) => {
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: "clamp",
    });

    const opacity = progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.8, 1],
      extrapolate: "clamp",
    });

    const handleDelete = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onDelete(item.id);
    };

    return (
      <Animated.View
        className="justify-center items-center bg-red-500 mx-4 mb-3 rounded-2xl"
        style={[
          {
            width: swipeConfig.deleteButtonWidth,
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleDelete}
          className="flex-1 justify-center items-center px-4"
        >
          <Ionicons name="trash-outline" size={24} color="white" />
          <Text className="text-white text-xs mt-1 font-medium">
            {t("notifications.delete")}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return { renderRightActions };
}

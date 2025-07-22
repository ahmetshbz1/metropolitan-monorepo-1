//  "CartItemSwipeActions.tsx"
//  metropolitan app
//  Created by Ahmet on 02.07.2025.

import { getSwipeActionStyle } from "@/utils/cartItemStyles";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Animated, Text, TouchableOpacity } from "react-native";

interface UseCartItemSwipeActionsProps {
  onDelete: () => void;
}

export const useCartItemSwipeActions = ({
  onDelete,
}: UseCartItemSwipeActionsProps) => {
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

    return (
      <Animated.View
        className="justify-center items-center bg-red-500 mx-4 mb-3 rounded-2xl"
        style={[
          getSwipeActionStyle(),
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <TouchableOpacity
          onPress={onDelete}
          className="flex-1 justify-center items-center px-4"
        >
          <Ionicons name="trash-outline" size={24} color="white" />
          <Text className="text-white text-xs mt-1 font-medium">Sil</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return { renderRightActions };
};

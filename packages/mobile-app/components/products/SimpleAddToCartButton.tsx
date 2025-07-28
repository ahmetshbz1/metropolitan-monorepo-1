//  "SimpleAddToCartButton.tsx"
//  metropolitan app
//  Created by Ahmet on 30.06.2025.

import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { ActivityIndicator, TouchableOpacity, GestureResponderEvent } from "react-native";
import type { ThemeColors } from "@/types/theme";

interface SimpleAddToCartButtonProps {
  onPress: (e: GestureResponderEvent) => Promise<void>;
  colors: ThemeColors;
  outOfStock?: boolean;
}

export const SimpleAddToCartButton: React.FC<SimpleAddToCartButtonProps> = ({
  onPress,
  colors,
  outOfStock = false,
}) => {
  const [state, setState] = useState<"idle" | "loading" | "success">("idle");

  const handlePress = async (e: GestureResponderEvent) => {
    if (state !== "idle") return;

    Haptics.selectionAsync();
    setState("loading");

    try {
      await onPress(e);
      setState("success");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeout(() => setState("idle"), 1500);
    } catch {
      setState("idle");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const getIcon = () => {
    switch (state) {
      case "success":
        return "checkmark";
      default:
        return outOfStock ? "notifications-outline" : "cart-outline";
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="w-10 h-10 rounded-full items-center justify-center"
      style={{ backgroundColor: colors.primary }}
      activeOpacity={0.8}
    >
      {state === "loading" ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Ionicons name={getIcon()} size={18} color="#fff" />
      )}
    </TouchableOpacity>
  );
};

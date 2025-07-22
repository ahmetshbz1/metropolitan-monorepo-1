//  "ReorderButton.tsx"
//  metropolitan app
//  Created by Ahmet on 25.06.2025.

import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { TouchableOpacity } from "react-native";

interface ReorderButtonProps {
  onPress: () => void;
  colors: any;
  t: (key: string) => string;
}

export const ReorderButton: React.FC<ReorderButtonProps> = ({
  onPress,
  colors,
  t,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center gap-2 p-2 -m-2"
    >
      <Ionicons name="repeat" size={18} color={colors.tint} />
      <ThemedText
        style={{ color: colors.tint }}
        className="font-semibold text-base"
      >
        {t("order_detail.reorder.button_text")}
      </ThemedText>
    </TouchableOpacity>
  );
};

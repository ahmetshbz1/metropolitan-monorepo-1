//  "ReorderButton.tsx"
//  metropolitan app
//  Created by Ahmet on 25.06.2025.
//  Updated on 23.09.2025 for better visibility

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

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
    >
      <View
        className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg"
        style={{
          backgroundColor: colors.tint + '10',
          borderWidth: 1,
          borderColor: colors.tint
        }}
      >
        <Ionicons name="repeat" size={16} color={colors.tint} />
        <Text
          className="font-semibold text-sm"
          style={{ color: colors.tint }}
        >
          {t("order_detail.reorder.button_text")}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

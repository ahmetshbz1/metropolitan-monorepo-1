//  "InfoRow.tsx"
//  metropolitan app
//  Created by Ahmet on 03.07.2025.

import { ThemedText } from "@/components/ThemedText";
import {
  INFO_ROW_CONFIG,
  createDeliveryPaymentStyles,
} from "@/utils/deliveryPaymentStyles";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { TouchableOpacity, View } from "react-native";

interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
  colors: any;
  isExpandable?: boolean;
  isExpanded?: boolean;
  onPress?: () => void;
}

export const InfoRow: React.FC<InfoRowProps> = ({
  icon,
  label,
  value,
  colors,
  isExpandable = false,
  isExpanded = false,
  onPress,
}) => {
  const styles = createDeliveryPaymentStyles(colors);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!isExpandable}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center py-2.5">
        <Ionicons
          name={icon as any}
          size={INFO_ROW_CONFIG.iconSize}
          color={colors.darkGray}
          style={styles.infoRowIcon}
        />
        <View className="flex-1">
          <ThemedText className="text-sm opacity-70 mb-1">{label}</ThemedText>
          <ThemedText className="text-base" style={{ flexShrink: 1 }}>
            {value}
          </ThemedText>
        </View>
        {isExpandable && (
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={INFO_ROW_CONFIG.chevronSize}
            color={colors.darkGray}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

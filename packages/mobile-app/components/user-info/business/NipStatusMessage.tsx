//  "NipStatusMessage.tsx"
//  metropolitan app
//  Created by Ahmet on 15.07.2025.
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

interface NipStatusMessageProps {
  nipError: string | null;
  nipWarning: string | null;
  themeColors: any;
}

export function NipStatusMessage({
  nipError,
  nipWarning,
  themeColors,
}: NipStatusMessageProps) {
  if (nipError) {
    return (
      <View
        className="mt-3 p-3 rounded-lg"
        style={{ backgroundColor: `${themeColors.danger}15` }}
      >
        <View className="flex-row items-center">
          <Ionicons
            name="close-circle"
            size={16}
            color={themeColors.danger}
          />
          <Text
            className="text-sm ml-2"
            style={{ color: themeColors.danger }}
          >
            {nipError}
          </Text>
        </View>
      </View>
    );
  }

  if (nipWarning) {
    return (
      <View
        className="mt-3 p-3 rounded-lg"
        style={{ backgroundColor: "#FFA50015" }}
      >
        <View className="flex-row items-center">
          <Ionicons name="warning" size={16} color="#FFA500" />
          <Text className="text-sm ml-2" style={{ color: "#FFA500" }}>
            {nipWarning}
          </Text>
        </View>
      </View>
    );
  }

  return null;
}

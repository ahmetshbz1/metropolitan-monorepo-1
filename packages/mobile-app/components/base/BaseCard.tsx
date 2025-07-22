//  "BaseCard.tsx"
//  metropolitan app
//  Created by Ahmet on 09.06.2025.

import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useTheme } from "@/hooks/useTheme";
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

interface BaseCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  margin?: number;
  borderRadius?: number;
}

export const BaseCard: React.FC<BaseCardProps> = ({
  children,
  style,
  padding = 20,
  margin = 0,
  borderRadius = 16,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius,
          margin,
        },
        style,
      ]}
    >
      <ThemedView
        className="overflow-hidden"
        style={{
          padding,
          borderRadius,
        }}
        lightColor={Colors.light.card}
        darkColor={Colors.dark.card}
      >
        {children}
      </ThemedView>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

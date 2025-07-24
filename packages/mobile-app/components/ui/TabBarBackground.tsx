//  "TabBarBackground.tsx"
//  metropolitan app
//  Created by Ahmet on 01.07.2025.

import { useColorScheme } from "@/hooks/useColorScheme";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, View } from "react-native";

// Enhanced glassmorphism effect for both iOS and Android
export default function TabBarBackground() {
  const colorScheme = useColorScheme();

  // iOS için native BlurView kullan
  if (Platform.OS === "ios") {
    return (
      <BlurView
        tint={colorScheme === "dark" ? "dark" : "light"}
        intensity={80}
        style={StyleSheet.absoluteFill}
      />
    );
  }

  // Android için iOS'a benzer glassmorphism simulation
  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Ana arkaplan gradient - iOS'a benzer */}
      <LinearGradient
        colors={
          colorScheme === "dark"
            ? ["rgba(28, 28, 30, 0.94)", "rgba(44, 44, 46, 0.90)"]
            : ["rgba(255, 255, 255, 0.94)", "rgba(242, 242, 247, 0.90)"]
        }
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Frosted glass overlay */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor:
              colorScheme === "dark"
                ? "rgba(28, 28, 30, 0.55)"
                : "rgba(255, 255, 255, 0.65)",
          },
        ]}
      />

      {/* Üst border - iOS benzeri */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: StyleSheet.hairlineWidth,
          backgroundColor:
            colorScheme === "dark"
              ? "rgba(84, 84, 88, 0.65)"
              : "rgba(60, 60, 67, 0.29)",
        }}
      />
    </View>
  );
}

export function useBottomTabOverflow() {
  return 0;
}

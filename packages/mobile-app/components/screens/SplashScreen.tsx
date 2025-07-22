//  "SplashScreen.tsx"
//  metropolitan app
//  Created by Ahmet on 21.07.2025. Updated on 21.07.2025.

import React, { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, Image, View } from "react-native";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export const SplashScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Smooth fade in ve scale animasyonu
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <View
      className="flex-1 justify-center items-center px-8"
      style={{ backgroundColor: colors.background }}
    >
      <Animated.View
        className="items-center"
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        {/* Logo Image */}
        <View>
          <Image
            source={require("@/assets/images/metropolitan.png")}
            className="w-44 h-44 rounded-2xl"
            resizeMode="cover"
          />
        </View>
      </Animated.View>

      {/* Minimal Loading Indicator */}
      <View className="absolute bottom-20">
        <ActivityIndicator size="small" color={colors.tabIconDefault} />
      </View>
    </View>
  );
};

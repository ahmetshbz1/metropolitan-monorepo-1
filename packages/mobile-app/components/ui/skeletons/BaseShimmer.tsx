//  "BaseShimmer.tsx"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";

interface BaseShimmerProps {
  width?: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}

export function BaseShimmer({
  width = "100%",
  height,
  borderRadius = 8,
  style,
}: BaseShimmerProps) {
  const animatedValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: "#E5E7EB",
          borderRadius,
          opacity: animatedValue,
        },
        style,
      ]}
    />
  );
}

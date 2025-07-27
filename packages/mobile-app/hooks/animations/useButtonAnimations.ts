//  "useButtonAnimations.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import { useRef } from "react";
import { ColorSchemeName } from "react-native";
import {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

export const useButtonAnimations = (colorScheme: ColorSchemeName) => {
  // Animation values
  const loadingProgress = useSharedValue(0);
  const successScale = useSharedValue(1);
  const successOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const iconRotation = useSharedValue(0);
  const bgColorProgress = useSharedValue(0);

  // Animated styles
  const buttonAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      bgColorProgress.value,
      [0, 1],
      [
        colorScheme === "dark" ? "#262626" : "#f9fafb",
        colorScheme === "dark" ? "#065f46" : "#a7f3d0",
      ]
    );

    return {
      transform: [{ scale: buttonScale.value }],
      backgroundColor,
    };
  });

  const loadingBarStyle = useAnimatedStyle(() => ({
    width: `${loadingProgress.value * 100}%`,
    opacity: loadingProgress.value > 0 ? 1 : 0,
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotation.value}deg` }],
  }));

  const successIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
    opacity: successOpacity.value,
  }));

  // Animation methods
  const startPressAnimation = () => {
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
  };

  const startLoadingAnimation = (includeIconRotation: boolean = true) => {
    loadingProgress.value = withTiming(1, {
      duration: 800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    if (includeIconRotation) {
      iconRotation.value = withTiming(360, {
        duration: 400,
        easing: Easing.out(Easing.quad),
      });
    }
  };

  const showSuccessAnimation = () => {
    successScale.value = withTiming(1, { duration: 300 });
    successOpacity.value = withTiming(1, { duration: 300 });
    bgColorProgress.value = withTiming(1, { duration: 400 });
  };

  const hideSuccessAnimation = () => {
    successOpacity.value = withTiming(0, { duration: 400 });
    bgColorProgress.value = withTiming(0, { duration: 500 });
  };

  const showErrorAnimation = (includeIconRotation: boolean = true) => {
    buttonScale.value = withSequence(
      withTiming(1.05, { duration: 50 }),
      withTiming(0.95, { duration: 50 }),
      withTiming(1.05, { duration: 50 }),
      withTiming(1, { duration: 50 })
    );
    loadingProgress.value = withTiming(0, { duration: 200 });
    if (includeIconRotation) {
      iconRotation.value = withTiming(0, { duration: 200 });
    }
  };

  return {
    // Animation values
    loadingProgress,
    successScale,
    successOpacity,
    buttonScale,
    iconRotation,
    bgColorProgress,
    
    // Animated styles
    buttonAnimatedStyle,
    loadingBarStyle,
    iconAnimatedStyle,
    successIconStyle,
    
    // Animation methods
    startPressAnimation,
    startLoadingAnimation,
    showSuccessAnimation,
    hideSuccessAnimation,
    showErrorAnimation,
  };
};
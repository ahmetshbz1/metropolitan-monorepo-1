//  "AddToCartButton.tsx"
//  metropolitan app
//  Created by Ahmet on 23.07.2025.

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ColorSchemeName, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { ThemedText } from "../ThemedText";
import { AnimatedCheckmark } from "./AnimatedCheckmark";

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface AddToCartButtonProps {
  onPress: (e: any) => Promise<void>;
  disabled?: boolean;
  colorScheme: ColorSchemeName;
  colors: any;
  price: string;
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  onPress,
  disabled = false,
  colorScheme,
  colors,
  price,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  
  // Animation values
  const loadingProgress = useSharedValue(0);
  const successScale = useSharedValue(1);
  const successOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const iconRotation = useSharedValue(0);
  const bgColorProgress = useSharedValue(0);

  const handlePress = async (e: any) => {
    if (disabled || isLoading || isSuccess) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Button press animation
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
    
    setIsLoading(true);
    
    // Start loading animation
    loadingProgress.value = withTiming(1, {
      duration: 800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    
    // Rotate add icon
    iconRotation.value = withTiming(180, {
      duration: 400,
      easing: Easing.out(Easing.quad),
    });
    
    try {
      await onPress(e);
      
      // Success animation
      setIsLoading(false);
      setIsSuccess(true);
      
      successScale.value = withSequence(
        withTiming(1.2, { duration: 200 }),
        withSpring(1, { damping: 8, stiffness: 200 })
      );
      
      successOpacity.value = withTiming(1, { duration: 200 });
      bgColorProgress.value = withTiming(1, { duration: 300 });
      
    } catch {
      // Error state - shake animation
      setIsLoading(false);
      buttonScale.value = withSequence(
        withTiming(1.05, { duration: 50 }),
        withTiming(0.95, { duration: 50 }),
        withTiming(1.05, { duration: 50 }),
        withTiming(1, { duration: 50 })
      );
      loadingProgress.value = withTiming(0, { duration: 200 });
      iconRotation.value = withTiming(0, { duration: 200 });
    }
  };

  // Animated styles
  const buttonAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      bgColorProgress.value,
      [0, 1],
      [
        colorScheme === 'dark' ? '#262626' : '#f9fafb',
        colorScheme === 'dark' ? '#065f46' : '#d1fae5'
      ]
    );
    
    return {
      transform: [{ scale: buttonScale.value }],
      backgroundColor,
    };
  });

  const loadingBarStyle = useAnimatedStyle(() => ({
    width: `${loadingProgress.value * 100}%`,
    opacity: isLoading ? 1 : 0,
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotation.value}deg` }],
  }));

  const successIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
    opacity: successOpacity.value,
  }));

  return (
    <AnimatedTouchableOpacity
      className={`
        relative overflow-hidden flex-row items-center justify-between px-3 py-2 rounded-xl
        ${disabled ? 'opacity-60' : ''}
      `}
      onPress={handlePress}
      disabled={disabled || isSuccess}
      activeOpacity={0.8}
      style={buttonAnimatedStyle}
    >
      {/* Loading Progress Bar */}
      <Animated.View
        className="absolute inset-0 bg-opacity-20"
        style={[
          loadingBarStyle,
          { backgroundColor: colors.tint + '20' }
        ]}
      />

      {!isSuccess ? (
        <>
          {/* Price */}
          <ThemedText
            className="text-lg font-bold z-10"
            style={{ color: colors.tint }}
          >
            {price}
          </ThemedText>

          {/* Add Button with Icon */}
          <View className="flex-row items-center z-10">
            <Animated.View style={iconAnimatedStyle}>
              <Ionicons 
                name={isLoading ? "sync" : "add"} 
                size={16} 
                color={disabled ? colors.mediumGray : colors.tint} 
              />
            </Animated.View>
            <ThemedText
              className="text-sm font-medium ml-1"
              style={{ color: disabled ? colors.mediumGray : colors.tint }}
            >
              {isLoading ? "Ekleniyor" : "Ekle"}
            </ThemedText>
          </View>
        </>
      ) : (
        <Animated.View 
          className="flex-row items-center justify-center w-full"
          style={successIconStyle}
        >
          <AnimatedCheckmark 
            size={18} 
            color={colors.success || colors.tint} 
            visible={isSuccess}
          />
          <ThemedText
            className="text-sm font-semibold ml-1"
            style={{ color: colors.success || colors.tint }}
          >
            {"Sepete Eklendi"}
          </ThemedText>
        </Animated.View>
      )}
    </AnimatedTouchableOpacity>
  );
};
//  "AddToCartButtonContent.tsx"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import React from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { AnimatedCheckmark } from "./AnimatedCheckmark";

interface ButtonContentProps {
  isSuccess: boolean;
  showPrice: boolean;
  price?: string;
  outOfStock: boolean;
  colors: any;
  currentSize: {
    paddingX: number;
    paddingY: number;
    fontSize: number;
    iconSize: number;
  };
  iconAnimatedStyle: any;
  successIconStyle: any;
  disabled: boolean;
  isLoading: boolean;
  customText?: string;
  colorScheme: "light" | "dark" | null;
  buttonText: string;
}

export const AddToCartButtonContent: React.FC<ButtonContentProps> = ({
  isSuccess,
  showPrice,
  price,
  outOfStock,
  colors,
  currentSize,
  iconAnimatedStyle,
  successIconStyle,
  disabled,
  isLoading,
  customText,
  colorScheme,
  buttonText,
}) => {
  if (isSuccess) {
    return (
      <Animated.View
        className="flex-row items-center justify-center w-full"
        style={successIconStyle}
      >
        <AnimatedCheckmark
          size={currentSize.iconSize}
          color={colorScheme === "dark" ? "#FFFFFF" : "#059669"}
          visible={isSuccess}
        />
        <ThemedText
          className="font-bold ml-1"
          style={{
            color: colorScheme === "dark" ? "#FFFFFF" : "#047857",
            fontSize: currentSize.fontSize * 0.92,
          }}
        >
          {customText || buttonText}
        </ThemedText>
      </Animated.View>
    );
  }

  return (
    <>
      {/* Price - Hide for out of stock items */}
      {showPrice && price && !outOfStock && (
        <ThemedText
          className="font-bold z-10"
          style={{
            color: colors.tint,
            fontSize: currentSize.fontSize,
          }}
        >
          {price}
        </ThemedText>
      )}

      {/* Add Button with Icon or Notify Button */}
      <View className="flex-row items-center z-10">
        <Animated.View style={iconAnimatedStyle}>
          <Ionicons
            name={
              outOfStock
                ? "notifications-outline"
                : isLoading
                  ? "sync"
                  : "cart-outline"
            }
            size={currentSize.iconSize}
            color={disabled ? colors.mediumGray : colors.tint}
          />
        </Animated.View>
        <ThemedText
          className="font-medium ml-1"
          style={{
            color: disabled ? colors.mediumGray : colors.tint,
            fontSize: currentSize.fontSize,
          }}
        >
          {customText || buttonText}
        </ThemedText>
      </View>
    </>
  );
};
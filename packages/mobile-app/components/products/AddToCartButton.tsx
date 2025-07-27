//  "AddToCartButton.tsx"
//  metropolitan app
//  Created by Ahmet on 23.07.2025.

import React from "react";
import { useTranslation } from "react-i18next";
import { ColorSchemeName, TouchableOpacity } from "react-native";
import Animated from "react-native-reanimated";
import { useButtonAnimations } from "@/hooks/animations/useButtonAnimations";
import { useAddToCartState } from "@/hooks/animations/useAddToCartState";
import { AddToCartButtonContent } from "./AddToCartButtonContent";

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

interface AddToCartButtonProps {
  onPress: (e: any) => Promise<void>;
  disabled?: boolean;
  colorScheme: ColorSchemeName;
  colors: any;
  price?: string;
  showPrice?: boolean;
  customText?: string;
  isAlreadyAdded?: boolean;
  size?: "small" | "medium" | "large";
  outOfStock?: boolean;
}

// Size'a göre padding ve font ayarları - BaseButton ile uyumlu
const sizeStyles = {
  small: { paddingX: 12, paddingY: 8, fontSize: 14, iconSize: 16 },
  medium: { paddingX: 24, paddingY: 12, fontSize: 16, iconSize: 18 },
  large: { paddingX: 24, paddingY: 12, fontSize: 16, iconSize: 18 },
};

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  onPress,
  disabled = false,
  colorScheme,
  colors,
  price,
  showPrice = true,
  customText,
  isAlreadyAdded = false,
  size = "small",
  outOfStock = false,
}) => {
  const { t } = useTranslation();
  
  // State management
  const {
    isLoading,
    isSuccess,
    showAddedText,
    isProcessingRef,
    startLoading,
    showSuccess,
    hideSuccess,
    showError,
  } = useAddToCartState();

  // Animations
  const {
    buttonAnimatedStyle,
    loadingBarStyle,
    iconAnimatedStyle,
    successIconStyle,
    startPressAnimation,
    startLoadingAnimation,
    showSuccessAnimation,
    hideSuccessAnimation,
    showErrorAnimation,
  } = useButtonAnimations(colorScheme);

  const handlePress = async (e: any) => {
    if (disabled || isLoading || isProcessingRef.current) return;

    // Race condition koruması
    isProcessingRef.current = true;

    e.preventDefault();
    e.stopPropagation();

    startPressAnimation();
    startLoading();
    startLoadingAnimation(!outOfStock);

    try {
      await onPress(e);

      // Success
      showSuccess();
      showSuccessAnimation();
      hideSuccess();
      
      // Hide animations after delay
      setTimeout(() => {
        hideSuccessAnimation();
      }, 2000);
    } catch {
      // Error
      showError();
      showErrorAnimation(!outOfStock);
    } finally {
      // Race condition korumasını kaldır
      isProcessingRef.current = false;
    }
  };

  const currentSize = sizeStyles[size];

  // Button text logic
  const getButtonText = () => {
    if (outOfStock) {
      return isSuccess
        ? t("product_detail.purchase.notify_success")
        : t("product_detail.purchase.notify_me");
    }
    return isSuccess
      ? t("product_detail.purchase.added_to_cart")
      : isLoading
        ? t("product_detail.purchase.adding_to_cart")
        : "";
  };

  return (
    <AnimatedTouchableOpacity
      className={`
        relative overflow-hidden flex-row items-center ${outOfStock ? "justify-center" : "justify-between"} rounded-xl
        ${disabled ? "opacity-60" : ""}
      `}
      style={[
        buttonAnimatedStyle,
        {
          paddingHorizontal: currentSize.paddingX,
          paddingVertical: currentSize.paddingY,
        },
      ]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {/* Loading Progress Bar */}
      <Animated.View
        className="absolute inset-0 bg-opacity-20"
        style={[loadingBarStyle, { backgroundColor: colors.tint + "20" }]}
      />

      <AddToCartButtonContent
        isSuccess={isSuccess}
        showPrice={showPrice}
        price={price}
        outOfStock={outOfStock}
        colors={colors}
        currentSize={currentSize}
        iconAnimatedStyle={iconAnimatedStyle}
        successIconStyle={successIconStyle}
        disabled={disabled}
        isLoading={isLoading}
        customText={customText}
        colorScheme={colorScheme}
        buttonText={getButtonText()}
      />
    </AnimatedTouchableOpacity>
  );
};

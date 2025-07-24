//  "AddToCartButton.tsx"
//  metropolitan app
//  Created by Ahmet on 23.07.2025.

import { useHaptics } from "@/hooks/useHaptics";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  const { triggerHaptic } = useHaptics();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(isAlreadyAdded);

  // Race condition koruması için ref
  const isProcessingRef = React.useRef(false);

  // Animation values
  const loadingProgress = useSharedValue(0);
  const successScale = useSharedValue(1);
  const successOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const iconRotation = useSharedValue(0);
  const bgColorProgress = useSharedValue(0);

  // Eğer component baştan "added" durumunda açılıyorsa animasyonları ayarla
  useEffect(() => {
    if (isAlreadyAdded) {
      setIsSuccess(true);
      successOpacity.value = 1;
      bgColorProgress.value = 1;
    } else {
      setIsSuccess(false);
      successOpacity.value = 0;
      bgColorProgress.value = 0;
    }
  }, [isAlreadyAdded, successOpacity, bgColorProgress]);

  const handlePress = async (e: any) => {
    if (disabled || isLoading || isSuccess || isProcessingRef.current) return;

    // Race condition koruması
    isProcessingRef.current = true;

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

    // Rotate add icon (only for add to cart, not for notify)
    if (!outOfStock) {
      iconRotation.value = withTiming(180, {
        duration: 400,
        easing: Easing.out(Easing.quad),
      });
    }

    try {
      await onPress(e);

      // Success animation
      setIsLoading(false);
      setIsSuccess(true);

      // Sepete ekleme başarılı olunca hafif titreşim
      triggerHaptic("light", true);

      // Yumuşak geçiş animasyonu (zıplama yok)
      successScale.value = withTiming(1, { duration: 200 });
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
      if (!outOfStock) {
        iconRotation.value = withTiming(0, { duration: 200 });
      }
    } finally {
      // Race condition korumasını kaldır
      isProcessingRef.current = false;
    }
  };

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
    opacity: isLoading ? 1 : 0,
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotation.value}deg` }],
  }));

  const successIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
    opacity: successOpacity.value,
  }));

  // Size'a göre padding ve font ayarları - BaseButton ile uyumlu
  const sizeStyles = {
    small: { paddingX: 12, paddingY: 8, fontSize: 14, iconSize: 16 },
    medium: { paddingX: 24, paddingY: 12, fontSize: 16, iconSize: 18 },
    large: { paddingX: 24, paddingY: 12, fontSize: 16, iconSize: 18 },
  };

  const currentSize = sizeStyles[size];

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
      disabled={disabled || isSuccess}
      activeOpacity={0.8}
    >
      {/* Loading Progress Bar */}
      <Animated.View
        className="absolute inset-0 bg-opacity-20"
        style={[loadingBarStyle, { backgroundColor: colors.tint + "20" }]}
      />

      {!isSuccess ? (
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
                      : "add"
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
              {customText ||
                (outOfStock
                  ? t("product_detail.purchase.notify_me")
                  : isLoading
                    ? t("product_detail.purchase.adding_to_cart")
                    : t("common.add"))}
            </ThemedText>
          </View>
        </>
      ) : (
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
              color: colorScheme === "dark" ? "#FFFFFF" : "#059669",
              fontSize: currentSize.fontSize * 0.92,
            }}
          >
            {customText ||
              (outOfStock
                ? t("product_detail.purchase.notify_success")
                : t("product_detail.purchase.added_to_cart"))}
          </ThemedText>
        </Animated.View>
      )}
    </AnimatedTouchableOpacity>
  );
};

//  "ProductCard.tsx"
//  metropolitan app
//  Created by Ahmet on 30.06.2025. Edited on 23.07.2025.

import { ThemedText } from "@/components/ThemedText";
import { Product } from "@/context/ProductContext";
import { useProductCard } from "@/hooks/useProductCard";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { HapticIconButton } from "../HapticButton";
import { ProductCardContent } from "./ProductCardContent";
import { ProductCardImage } from "./ProductCardImage";

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

interface ProductCardProps {
  product: Product;
  variant?: "grid" | "horizontal";
}

export const ProductCard = React.memo<ProductCardProps>(function ProductCard({
  product,
  variant = "grid",
}) {
  const {
    colors,
    colorScheme,
    isProductFavorite,
    categoryName,
    isLowStock,
    isOutOfStock,
    isProductInCart,
    cartItemQuantity,
    handleAddToCart,
    handleToggleFavorite,
  } = useProductCard(product);

  const isHorizontal = variant === "horizontal";

  // Animation values
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
    translateY.value = withSpring(2, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    translateY.value = withSpring(0, { damping: 15, stiffness: 400 });
  };

  return (
    <View
      className={isHorizontal ? "mr-3" : "mx-1 mb-3"}
      style={isHorizontal ? { width: 180 } : { width: "48%" }}
    >
      <Link
        href={{
          pathname: "/product/[id]",
          params: { id: product.id },
        }}
        asChild
      >
        <AnimatedTouchableOpacity
          activeOpacity={1}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          className="overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800/50"
          style={[
            animatedStyle,
            {
              shadowColor: colorScheme === "dark" ? "#000" : colors.tint,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: colorScheme === "dark" ? 0.3 : 0.12,
              shadowRadius: 12,
              elevation: 6,
            },
          ]}
        >
          {/* Image Section */}
          <ProductCardImage
            product={product}
            colorScheme={colorScheme}
            isOutOfStock={isOutOfStock}
            colors={colors}
          />

          {/* Content Section */}
          <ProductCardContent
            product={product}
            categoryName={categoryName}
            colorScheme={colorScheme}
            colors={colors}
            isOutOfStock={isOutOfStock}
            isLowStock={isLowStock}
            handleAddToCart={handleAddToCart}
          />

          {/* Simple Floating Favorite Button */}
          <HapticIconButton
            onPress={handleToggleFavorite}
            className="absolute top-3 right-3 w-10 h-10 justify-center items-center z-10 rounded-full bg-white dark:bg-neutral-800"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
            hapticType="light"
          >
            <Ionicons
              name={isProductFavorite ? "heart" : "heart-outline"}
              size={18}
              color={
                isProductFavorite
                  ? colors.danger
                  : colorScheme === "dark"
                    ? "#888"
                    : "#666"
              }
            />
          </HapticIconButton>

          {/* Cart Quantity Badge */}
          {cartItemQuantity > 0 && (
            <View
              className="absolute top-3 left-3 w-6 h-6 justify-center items-center z-10 rounded-full"
              style={{
                backgroundColor: colors.tint,
                shadowColor: colors.tint,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <ThemedText
                className="text-xs font-bold"
                style={{ color: "#FFFFFF" }}
              >
                {cartItemQuantity}
              </ThemedText>
            </View>
          )}
        </AnimatedTouchableOpacity>
      </Link>
    </View>
  );
});

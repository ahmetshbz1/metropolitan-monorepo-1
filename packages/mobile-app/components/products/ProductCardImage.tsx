//  "ProductCardImage.tsx"
//  metropolitan app
//  Created by Ahmet on 03.07.2025. Edited on 23.07.2025.

import { Product } from "@/context/ProductContext";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { useTranslation } from "react-i18next";
import { ColorSchemeName, View, GestureResponderEvent } from "react-native";
import { ThemedText } from "../ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { HapticIconButton } from "../HapticButton";

interface ProductCardImageProps {
  product: Product;
  colorScheme: ColorSchemeName;
  isOutOfStock: boolean;
  colors: any;
  isProductFavorite: boolean;
  handleToggleFavorite: (e: GestureResponderEvent) => void;
  handleAddToCart: (e: GestureResponderEvent) => Promise<void>;
}

export const ProductCardImage: React.FC<ProductCardImageProps> = ({
  product,
  colorScheme,
  isOutOfStock,
  colors,
  isProductFavorite,
  handleToggleFavorite,
  handleAddToCart,
}) => {
  const { t } = useTranslation();

  return (
    <View
      className="relative items-center justify-center overflow-hidden"
      style={{
        aspectRatio: 1,
        backgroundColor: colorScheme === 'dark' ? '#1f1f1f' : '#f8f8f8',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
      }}
    >
      {/* Enhanced gradient background */}
      <LinearGradient
        colors={
          colorScheme === 'dark'
            ? ['#2a2a2a', '#1a1a1a', '#0f0f0f']
            : ['#ffffff', '#f8f9fa', '#f1f3f4']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />

      <Image
        source={{ uri: product.image }}
        style={{
          width: '85%',
          height: '85%',
        }}
        contentFit="contain"
        transition={400}
        cachePolicy="memory-disk"
      />

      {/* Enhanced gradient overlay for depth */}
      <LinearGradient
        colors={
          colorScheme === 'dark'
            ? ['rgba(255,255,255,0)', 'rgba(255,255,255,0.02)']
            : ['rgba(0,0,0,0)', 'rgba(0,0,0,0.04)']
        }
        start={{ x: 0, y: 0.5 }}
        end={{ x: 0, y: 1 }}
        className="absolute inset-0"
        pointerEvents="none"
      />

      {/* Favorite Button - Top Right */}
      <HapticIconButton
        onPress={handleToggleFavorite}
        className="absolute top-2 right-2 w-7 h-7 rounded-full justify-center items-center z-20"
        style={{
          backgroundColor: colorScheme === 'dark' ? 'rgba(40, 40, 40, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        }}
      >
        <Ionicons
          name={isProductFavorite ? "heart" : "heart-outline"}
          size={14}
          color={isProductFavorite ? colors.danger : (colorScheme === "dark" ? "#fff" : "#000")}
        />
      </HapticIconButton>

      {/* Add to Cart Button - Below Favorite */}
      {!isOutOfStock && (
        <HapticIconButton
          onPress={handleAddToCart}
          className="absolute top-11 right-2 w-7 h-7 rounded-full justify-center items-center z-20"
          style={{
            backgroundColor: colors.primary,
          }}
        >
          <Ionicons
            name="add"
            size={16}
            color="#fff"
          />
        </HapticIconButton>
      )}

      {/* Out of Stock Overlay */}
      {isOutOfStock && (
        <View
          className="absolute inset-0 items-center justify-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
        >
          <View
            className="px-3 py-1.5 rounded"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
            }}
          >
            <ThemedText className="text-xs font-medium" style={{ color: '#1a1a1a' }}>
              {t("product.out_of_stock")}
            </ThemedText>
          </View>
        </View>
      )}
    </View>
  );
};

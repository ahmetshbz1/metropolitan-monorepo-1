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
        backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
      }}
    >
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

      {/* Add to Cart Button - Top Right */}
      {!isOutOfStock && (
        <HapticIconButton
          onPress={handleAddToCart}
          className="absolute top-1.5 right-1.5 rounded-full justify-center items-center z-20"
          style={{
            backgroundColor: colors.primary,
            width: 28,
            height: 28,
          }}
        >
          <Ionicons
            name="add-circle"
            size={18}
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

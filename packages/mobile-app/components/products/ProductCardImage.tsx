//  "ProductCardImage.tsx"
//  metropolitan app
//  Created by Ahmet on 03.07.2025. Edited on 23.07.2025.

import { Product } from "@/context/ProductContext";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { useTranslation } from "react-i18next";
import { ColorSchemeName, View } from "react-native";
import { ThemedText } from "../ThemedText";

interface ProductCardImageProps {
  product: Product;
  colorScheme: ColorSchemeName;
  isOutOfStock: boolean;
  colors: any;
}

export const ProductCardImage: React.FC<ProductCardImageProps> = ({
  product,
  colorScheme,
  isOutOfStock,
  colors,
}) => {
  const { t } = useTranslation();

  return (
    <View 
      className="relative items-center justify-center overflow-hidden"
      style={{ 
        aspectRatio: 1,
        backgroundColor: colorScheme === 'dark' ? '#1f1f1f' : '#f8f8f8',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
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

      {/* Stock status overlay - modernized */}
      {isOutOfStock && (
        <View
          className="absolute inset-0 items-center justify-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
        >
          <View
            className="px-4 py-2 rounded-full backdrop-blur-sm"
            style={{ 
              backgroundColor: colors.danger,
              shadowColor: colors.danger,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <ThemedText className="text-sm font-semibold text-white">
              {t("product.out_of_stock")}
            </ThemedText>
          </View>
        </View>
      )}
    </View>
  );
};

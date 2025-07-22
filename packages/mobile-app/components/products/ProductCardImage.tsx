//  "ProductCardImage.tsx"
//  metropolitan app
//  Created by Ahmet on 03.07.2025. Edited on 19.07.2025.

import { Product } from "@/context/ProductContext";
import { Image } from "expo-image";
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
      className="relative bg-gray-50 items-center justify-center"
      style={{ 
        height: 160,
        backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f9f9f9'
      }}
    >
      <Image
        source={{ uri: product.image }}
        style={{
          width: '85%',
          height: '85%',
        }}
        contentFit="contain"
        transition={200}
      />

      {/* Stock status overlay */}
      {isOutOfStock && (
        <View
          className="absolute inset-0 items-center justify-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <View
            className="px-2 py-1 rounded"
            style={{ backgroundColor: colors.danger }}
          >
            <ThemedText className="text-xs font-medium text-white">
              {t("product.out_of_stock")}
            </ThemedText>
          </View>
        </View>
      )}
    </View>
  );
};

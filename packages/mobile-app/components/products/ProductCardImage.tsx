//  "ProductCardImage.tsx"
//  metropolitan app
//  Created by Ahmet on 03.07.2025. Edited on 23.07.2025.

import { Product } from "@/context/ProductContext";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ColorSchemeName, GestureResponderEvent, View } from "react-native";
import { HapticIconButton } from "../HapticButton";
import { ThemedText } from "../ThemedText";

interface ProductCardImageProps {
  product: Product;
  colorScheme: ColorSchemeName;
  isOutOfStock: boolean;
  colors: any;
  isProductFavorite: boolean;
  handleToggleFavorite: (e?: GestureResponderEvent) => void;
  handleAddToCart: (e: GestureResponderEvent) => Promise<void>;
}

const ProductCardImageComponent: React.FC<ProductCardImageProps> = ({
  product,
  colorScheme,
  isOutOfStock,
  colors,
  isProductFavorite,
  handleToggleFavorite,
  handleAddToCart,
}) => {
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <View
      className="relative items-center justify-center overflow-hidden"
      style={{
        aspectRatio: 1,
        backgroundColor: colorScheme === "dark" ? "#1a1a1a" : "#ffffff",
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
      }}
    >
      {!imageError ? (
        <Image
          source={{
            uri: `${product.image}${retryCount > 0 ? `?retry=${retryCount}` : ""}`,
            headers: {
              "Cache-Control": "max-age=31536000",
            },
          }}
          style={{
            width: "85%",
            height: "85%",
          }}
          contentFit="contain"
          transition={200}
          cachePolicy="memory-disk"
          priority="high"
          recyclingKey={product.id}
          placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
          placeholderContentFit="contain"
          allowDownscaling={true}
          responsivePolicy="live"
          contentPosition="center"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            if (retryCount < 3) {
              setTimeout(() => setRetryCount((prev) => prev + 1), 1000 * (retryCount + 1));
            } else {
              setImageError(true);
            }
          }}
        />
      ) : (
        <View className="items-center justify-center" style={{ width: "85%", height: "85%" }}>
          <Ionicons
            name="image-outline"
            size={48}
            color={colorScheme === "dark" ? "#666" : "#ccc"}
          />
        </View>
      )}

      {/* Add to Cart Button - Top Right */}
      {!isOutOfStock && (
        <HapticIconButton
          onPress={(e) => {
            if (e) handleAddToCart(e);
          }}
          className="absolute top-1.5 right-1.5 rounded-full justify-center items-center z-20"
          style={{
            backgroundColor: colors.primary,
            width: 32,
            height: 32,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
        >
          <Ionicons
            name="add"
            size={20}
            color="#fff"
            style={{ fontWeight: "bold" }}
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
            className="px-3 py-1.5 rounded-lg"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
            }}
          >
            <ThemedText
              className="text-xs font-bold"
              style={{ color: "#1a1a1a" }}
            >
              {t("product.out_of_stock")}
            </ThemedText>
          </View>
        </View>
      )}
    </View>
  );
};

export const ProductCardImage = React.memo(
  ProductCardImageComponent,
  (prev, next) =>
    prev.product.id === next.product.id &&
    prev.isOutOfStock === next.isOutOfStock &&
    prev.isProductFavorite === next.isProductFavorite
);

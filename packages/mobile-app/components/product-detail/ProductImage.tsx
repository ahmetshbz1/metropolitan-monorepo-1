//  "ProductImage.tsx"
//  metropolitan app
//  Created by Ahmet on 09.06.2025.

import { Image } from "expo-image";
import React, { memo, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Product } from "@/context/ProductContext";

// Dimension'ları static olarak al - hiç değişmeyecek
const SCREEN_WIDTH = Dimensions.get("window").width;
const IMAGE_HEIGHT = SCREEN_WIDTH * 0.8;

interface ProductImageProps {
  product: Product | null;
}

// Helper function to ensure valid image URL
const getValidImageUrl = (imageUrl: string | undefined): string => {
  if (!imageUrl) return "";
  
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  
  const path = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "https://api.metropolitanfg.pl";
  return `${baseUrl}${path}`;
};

export const ProductImage = memo(function ProductImage({ product }: ProductImageProps) {
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const imageUrl = useMemo(() => getValidImageUrl(product?.image), [product?.image]);

  const handleImageError = useCallback(() => {
    if (retryCount < 2) {
      setTimeout(() => setRetryCount(prev => prev + 1), 1000);
    } else {
      setImageError(true);
    }
  }, [retryCount]);

  const handleImageLoad = useCallback(() => {
    setImageError(false);
  }, []);

  return (
    <Animated.View
      className="items-center justify-center bg-white p-5"
      style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT }}
      entering={FadeIn.duration(200)}
    >
      {!imageError && imageUrl ? (
        <Image
          source={{
            uri: retryCount > 0 ? `${imageUrl}?retry=${retryCount}&t=${Date.now()}` : imageUrl,
          }}
          style={{ width: "100%", height: "100%" }}
          contentFit="contain"
          transition={300}
          placeholder="L6Pj42%M4nWBVZJr00%M_4RjO[M|"
          placeholderContentFit="contain"
          cachePolicy="none"
          priority="high"
          allowDownscaling={false}
          contentPosition="center"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      ) : (
        <View className="items-center justify-center" style={{ width: "100%", height: "100%" }}>
          <Ionicons name="image-outline" size={80} color="#ccc" />
        </View>
      )}
      {product && product.stock <= 5 && (
        <View
          className="absolute px-2.5 py-1 rounded-2xl"
          style={{
            top: 20,
            left: 20,
            backgroundColor: "rgba(255, 0, 0, 0.7)",
          }}
        >
          <ThemedText className="text-white text-xs font-bold">
            {t("product_detail.low_stock", { count: product.stock })}
          </ThemedText>
        </View>
      )}
    </Animated.View>
  );
});

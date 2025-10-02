//  "ProductImage.tsx"
//  metropolitan app
//  Created by Ahmet on 09.06.2025.

import { Image } from "expo-image";
import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Product } from "@/context/ProductContext";

// Dimension'ları static olarak al - hiç değişmeyecek
const SCREEN_WIDTH = Dimensions.get("window").width;
const IMAGE_HEIGHT = SCREEN_WIDTH * 0.8;

interface ProductImageProps {
  product: Product | null;
}

export const ProductImage = memo(function ProductImage({ product }: ProductImageProps) {
  const { t } = useTranslation();

  return (
    <Animated.View
      className="items-center justify-center bg-white p-5"
      style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT }}
      entering={FadeIn.duration(200)}
    >
      <Image
        source={{
          uri: product?.image,
          headers: {
            "Cache-Control": "max-age=31536000",
          },
        }}
        style={{ width: "100%", height: "100%" }}
        contentFit="contain"
        transition={300}
        placeholder="L6Pj42%M4nWBVZJr00%M_4RjO[M|"
        placeholderContentFit="contain"
        cachePolicy="memory-disk"
        priority="high"
        allowDownscaling={true}
        responsivePolicy="live"
        contentPosition="center"
      />
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

//  "ProductImage.tsx"
//  metropolitan app
//  Created by Ahmet on 09.06.2025.

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, Share, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { HapticIconButton } from "@/components/HapticButton";
import { ThemedText } from "@/components/ThemedText";
import Colors from "@/constants/Colors";
import { Product } from "@/context/ProductContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useHaptics } from "@/hooks/useHaptics";

const { width } = Dimensions.get("window");

interface ProductImageProps {
  product: Product | null;
}

export function ProductImage({ product }: ProductImageProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { triggerHaptic } = useHaptics();

  const handleShare = async () => {
    if (product) {
      try {
        await Share.share({
          message: `${product.name} - ${t("product_detail.share.check_out_this_product")}`,
          title: product.name,
        });
        triggerHaptic("light");
      } catch (error) {
        console.error("Error sharing:", error);
      }
    }
  };

  return (
    <Animated.View
      className="items-center justify-center bg-white p-5"
      style={{
        width: width,
        height: width * 0.8,
      }}
      entering={FadeIn.duration(300)}
    >
      <Image
        source={{ uri: product?.image }}
        style={{ width: "100%", height: "100%" }}
        contentFit="contain"
        transition={400}
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

      <HapticIconButton
        onPress={handleShare}
        className="absolute top-2.5 right-2.5 w-8.5 h-8.5 justify-center items-center z-10"
        style={{
          backgroundColor: colors.cardBackground,
          borderRadius: 17,
        }}
        hapticType="light"
      >
        <Ionicons name="share-outline" size={22} color={colors.darkGray} />
      </HapticIconButton>
    </Animated.View>
  );
}

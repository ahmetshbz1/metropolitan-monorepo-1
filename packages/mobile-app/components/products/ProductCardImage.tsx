//  "ProductCardImage.tsx"
//  metropolitan app
//  Created by Ahmet on 03.07.2025. Edited on 23.07.2025.

import { Product } from "@/context/ProductContext";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

// Helper function to ensure valid image URL
const getValidImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return "";

  // Eğer tam URL ise direkt kullan
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  // Eğer relative path ise ve başında / yoksa ekle
  const path = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;

  // Fallback URL production için uygun olmalı
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "https://api.metropolitanfg.pl";
  return `${baseUrl}${path}`;
};

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
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  // Memoize image URL to prevent unnecessary recalculations
  const imageUrl = useMemo(
    () => getValidImageUrl(product.image),
    [product.image]
  );

  // Cleanup retry timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const handleImageError = useCallback(() => {
    // Clear any existing retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    // Retry logic with exponential backoff
    if (retryCount < 3) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
      retryTimeoutRef.current = setTimeout(() => {
        setRetryCount((prev) => prev + 1);
      }, delay);
    } else {
      setImageError(true);
    }
  }, [retryCount]);

  const handleImageLoad = useCallback(() => {
    // Image loaded successfully, reset error states
    setImageError(false);
  }, []);

  // Generate unique cache key
  const cacheKey = useMemo(() => `product-${product.id}`, [product.id]);

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
      {!imageError && imageUrl ? (
        <Image
          source={{
            uri:
              retryCount > 0
                ? `${imageUrl}?retry=${retryCount}&t=${Date.now()}`
                : imageUrl,
          }}
          style={{
            width: "85%",
            height: "85%",
          }}
          contentFit="contain"
          transition={150}
          cachePolicy="memory-disk"
          priority="high"
          recyclingKey={cacheKey}
          placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
          placeholderContentFit="contain"
          allowDownscaling={false}
          contentPosition="center"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      ) : (
        <View
          className="items-center justify-center"
          style={{ width: "85%", height: "85%" }}
        >
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
    prev.product.image === next.product.image &&
    prev.isOutOfStock === next.isOutOfStock &&
    prev.isProductFavorite === next.isProductFavorite
);

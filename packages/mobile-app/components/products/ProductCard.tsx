//  "ProductCard.tsx"
//  metropolitan app
//  Modern, basit ve performanslı ürün kartı

import { ThemedText } from "@/components/ThemedText";
import { Product } from "@metropolitan/shared";
import { useProductCard } from "@/hooks/useProductCard";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useNavigationProtection } from "@/hooks/useNavigationProtection";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View, type GestureResponderEvent } from "react-native";
import { HapticIconButton } from "../HapticButton";
import { MinimumQuantityDialog } from "./MinimumQuantityDialog";
import { Image } from "expo-image";
import { formatPrice } from "@/core/utils";

interface ProductCardProps {
  product: Product;
  replaceNavigation?: boolean;
  index?: number;
  isVisible?: boolean;
}

const getValidImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return "";

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  const path = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "https://api.metropolitanfg.pl";
  return `${baseUrl}${path}`;
};

export const ProductCard = React.memo<ProductCardProps>(function ProductCard({
  product,
  replaceNavigation = false,
  index = 0,
  isVisible = true,
}) {
  const {
    colors,
    colorScheme,
    isProductFavorite,
    isLowStock,
    isOutOfStock,
    cartQuantity,
    displayPrice,
    handleAddToCart,
    handleToggleFavorite,
    showMinQuantityDialog,
    minQuantityError,
    isAddingMinQuantity,
    handleAddMinQuantity,
    handleCloseDialog,
  } = useProductCard(product);

  const { t } = useTranslation();
  const router = useRouter();
  const { push: safePush } = useNavigationProtection({ debounceTime: 700 });

  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const imageUrl = useMemo(() => getValidImageUrl(product.image), [product.image]);

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const handleImageError = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

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
    setImageError(false);
    setImageLoading(false);
  }, []);

  const handleCardPress = () => {
    if (replaceNavigation) {
      router.replace(`/product/${product.id}`);
    } else {
      safePush(`/product/${product.id}`);
    }
  };

  // Tüm ürün resimlerini high priority ile yükle
  const imagePriority = "high";
  const cachePolicy = "memory-disk";

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <TouchableOpacity
        onPress={handleCardPress}
        activeOpacity={0.85}
        className="overflow-hidden rounded-2xl border"
        style={{
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          shadowColor: colorScheme === "dark" ? "#000" : colors.tint,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <View
          className="relative items-center justify-center overflow-hidden"
          style={{
            aspectRatio: 1,
            backgroundColor: "transparent",
          }}
        >
          {!imageError && imageUrl ? (
            <>
              <Image
                source={{
                  uri: retryCount > 0
                    ? `${imageUrl}?retry=${retryCount}&t=${Date.now()}`
                    : imageUrl,
                }}
                style={{
                  width: "85%",
                  height: "85%",
                  backgroundColor: "transparent",
                  opacity: imageLoading ? 0.5 : 1,
                }}
                contentFit="contain"
                transition={200}
                cachePolicy={cachePolicy}
                priority={imagePriority}
                placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
                placeholderContentFit="contain"
                allowDownscaling={false}
                contentPosition="center"
                onLoad={handleImageLoad}
                onError={handleImageError}
                recyclingKey={`product-${product.id}`}
              />
              {imageLoading && (
                <View
                  className="absolute inset-0 items-center justify-center"
                  style={{ backgroundColor: "transparent" }}
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: colorScheme === "dark" ? "#333" : "#f0f0f0",
                    }}
                  >
                    <Ionicons
                      name="image-outline"
                      size={24}
                      color={colorScheme === "dark" ? "#666" : "#ccc"}
                    />
                  </View>
                </View>
              )}
            </>
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

          {!isOutOfStock && (
            <View className="absolute top-2 right-2 z-20">
              <HapticIconButton
                onPress={(e) => {
                  if (e) handleAddToCart(e);
                }}
                className="rounded-full justify-center items-center"
                style={{
                  backgroundColor: colors.primary,
                  width: 36,
                  height: 36,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
                }}
              >
                <Ionicons name="add" size={22} color="#fff" style={{ fontWeight: "bold" }} />
              </HapticIconButton>

              {cartQuantity > 0 && (
                <View
                  className="absolute -top-1 -right-1 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: colors.danger,
                    minWidth: 20,
                    height: 20,
                    paddingHorizontal: 4,
                    borderWidth: 2,
                    borderColor: colorScheme === "dark" ? "#1a1a1a" : "#fff",
                  }}
                >
                  <ThemedText
                    className="text-white font-bold"
                    style={{ fontSize: 11, lineHeight: 13 }}
                  >
                    {cartQuantity}
                  </ThemedText>
                </View>
              )}
            </View>
          )}

          <HapticIconButton
            onPress={handleToggleFavorite}
            className="absolute top-2 left-2 rounded-full justify-center items-center z-20"
            style={{
              backgroundColor: isProductFavorite
                ? colors.danger
                : colorScheme === "dark"
                  ? "rgba(0, 0, 0, 0.4)"
                  : "rgba(255, 255, 255, 0.95)",
              width: 36,
              height: 36,
              borderWidth: 1,
              borderColor: isProductFavorite
                ? colors.danger
                : colorScheme === "dark"
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(0, 0, 0, 0.05)",
              shadowColor: isProductFavorite ? colors.danger : "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isProductFavorite ? 0.25 : 0.08,
              shadowRadius: 3.84,
              elevation: 4,
            }}
          >
            <Ionicons
              name={isProductFavorite ? "heart" : "heart-outline"}
              size={20}
              color={
                isProductFavorite
                  ? "#fff"
                  : colorScheme === "dark"
                    ? "rgba(255, 255, 255, 0.85)"
                    : colors.darkGray
              }
            />
          </HapticIconButton>

          {isOutOfStock && (
            <View
              className="absolute inset-0 items-center justify-center"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
            >
              <View
                className="px-3 py-2 rounded-lg"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}
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

        <View className="px-3 py-3" style={{ backgroundColor: colors.cardBackground, minHeight: 85 }}>
          <ThemedText
            className="text-base font-extrabold"
            style={{
              color: colors.primary,
              marginBottom: 6,
              letterSpacing: -0.3,
            }}
          >
            {formatPrice(displayPrice, product.currency)}
          </ThemedText>

          <ThemedText
            className="text-sm font-bold"
            numberOfLines={2}
            style={{
              lineHeight: 16,
              color: colorScheme === "dark" ? "#ffffff" : "#000000",
              letterSpacing: -0.2,
              marginBottom: 6,
              minHeight: 32,
            }}
          >
            {product.name}
          </ThemedText>

          <View className="flex-row items-center justify-between" style={{ marginTop: 'auto' }}>
            {product.size && (
              <ThemedText
                className="text-xs font-semibold"
                style={{
                  color: colorScheme === "dark" ? "#a3a3a3" : "#737373",
                }}
              >
                {product.size}
              </ThemedText>
            )}

            {isLowStock && !isOutOfStock && (
              <View className="flex-row items-center">
                <View className="w-1.5 h-1.5 bg-amber-400 rounded-full mr-1" />
                <ThemedText
                  className="text-xs font-bold"
                  style={{ color: colorScheme === "dark" ? "#fbbf24" : "#d97706" }}
                >
                  {product.stock}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>

      <MinimumQuantityDialog
        visible={showMinQuantityDialog}
        minQuantity={minQuantityError || 1}
        productName={product.name}
        loading={isAddingMinQuantity}
        onConfirm={handleAddMinQuantity}
        onCancel={handleCloseDialog}
      />
    </View>
  );
});

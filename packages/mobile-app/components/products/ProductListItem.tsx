//  "ProductListItem.tsx"
//  metropolitan app
//  Modern, horizontal list item for products

import { ThemedText } from "@/components/ThemedText";
import { Product } from "@/context/ProductContext";
import { useProductCard } from "@/hooks/useProductCard";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useNavigationProtection } from "@/hooks/useNavigationProtection";
import React, { useMemo, useState, useCallback } from "react";
import { TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { HapticIconButton } from "../HapticButton";
import { formatPrice } from "@/core/utils";

interface ProductListItemProps {
  product: Product;
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

export const ProductListItem = React.memo<ProductListItemProps>(function ProductListItem({
  product,
}) {
  const {
    colors,
    colorScheme,
    isLowStock,
    isOutOfStock,
    isProductFavorite,
    displayPrice,
    handleAddToCart,
    handleToggleFavorite,
  } = useProductCard(product);

  const { t } = useTranslation();
  const router = useRouter();
  const { push: safePush } = useNavigationProtection({ debounceTime: 700 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const imageUrl = useMemo(() => getValidImageUrl(product.image), [product.image]);

  const handlePress = () => {
    safePush(`/product/${product.id}`);
  };

  const handleAddToCartWithEvent = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await handleAddToCart(e);
  };

  const handleToggleFavoriteWithEvent = (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleToggleFavorite(e);
  };

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(false);
  }, []);

  const isDark = colorScheme === "dark";

  return (
    <View style={{ marginHorizontal: 12, marginBottom: 12 }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        style={{
          backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
          borderRadius: 16,
          padding: 12,
          flexDirection: "row",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.3 : 0.06,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        {/* Image Container */}
        <View
          style={{
            width: 90,
            height: 90,
            backgroundColor: "transparent",
            borderRadius: 12,
            marginRight: 12,
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
          }}
        >
          {imageUrl && !imageError ? (
            <Image
              source={{ uri: imageUrl }}
              style={{
                width: "90%",
                height: "90%",
              }}
              contentFit="contain"
              transition={200}
              cachePolicy="memory-disk"
              priority="high"
              onLoad={handleImageLoad}
              onError={handleImageError}
              recyclingKey={`product-list-${product.id}`}
            />
          ) : null}

          {(!imageLoaded || imageError || !imageUrl) && (
            <Ionicons
              name="image-outline"
              size={32}
              color={isDark ? "#404040" : "#d4d4d4"}
            />
          )}

          {isOutOfStock && (
            <View
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ThemedText
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  color: "#ffffff",
                  textTransform: "uppercase",
                }}
              >
                {t("product.out_of_stock")}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={{ flex: 1, justifyContent: "space-between" }}>
          {/* Product Name */}
          <ThemedText
            numberOfLines={2}
            style={{
              fontSize: 14,
              fontWeight: "600",
              lineHeight: 19,
              color: isDark ? "#ffffff" : "#1a1a1a",
              marginBottom: 4,
            }}
          >
            {product.name}
          </ThemedText>

          {/* Brand and Size */}
          {(product.brand || product.size) && (
            <ThemedText
              style={{
                fontSize: 12,
                fontWeight: "500",
                color: isDark ? "#737373" : "#a3a3a3",
                marginBottom: 8,
              }}
            >
              {[product.brand, product.size].filter(Boolean).join(" • ")}
            </ThemedText>
          )}

          {/* Bottom Row */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <ThemedText
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: colors.primary,
                letterSpacing: -0.3,
              }}
            >
              {formatPrice(displayPrice, product.currency)}
            </ThemedText>

            {isLowStock && !isOutOfStock && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 6,
                  backgroundColor: isDark
                    ? "rgba(251, 191, 36, 0.15)"
                    : "rgba(251, 191, 36, 0.1)",
                  gap: 3,
                }}
              >
                <View
                  style={{
                    width: 3,
                    height: 3,
                    borderRadius: 1.5,
                    backgroundColor: "#fbbf24",
                  }}
                />
                <ThemedText
                  style={{
                    fontSize: 10,
                    fontWeight: "600",
                    color: "#d97706",
                  }}
                >
                  {product.stock}
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View
          style={{
            flexDirection: "column",
            alignItems: "center",
            marginLeft: 8,
            gap: 8,
            justifyContent: "center",
          }}
        >
          {/* Favorite Button */}
          <HapticIconButton
            onPress={handleToggleFavoriteWithEvent}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: isDark
                ? "rgba(0, 0, 0, 0.5)"
                : "rgba(255, 255, 255, 0.9)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name={isProductFavorite ? "heart" : "heart-outline"}
              size={16}
              color={isProductFavorite ? "#ef4444" : isDark ? "#ffffff" : "#404040"}
            />
          </HapticIconButton>

          {/* Add to Cart Button */}
          {!isOutOfStock && (
            <HapticIconButton
              onPress={handleAddToCartWithEvent}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="add" size={18} color="#ffffff" />
            </HapticIconButton>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
});

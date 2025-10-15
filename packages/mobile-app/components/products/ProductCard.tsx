//  "ProductCard.tsx"
//  metropolitan app
//  Modern, minimalist ve performanslı ürün kartı

import { ThemedText } from "@/components/ThemedText";
import { Product } from "@metropolitan/shared";
import { useProductCard } from "@/hooks/useProductCard";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useNavigationProtection } from "@/hooks/useNavigationProtection";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View, Animated } from "react-native";
import { HapticIconButton } from "../HapticButton";
import { MinimumQuantityDialog } from "./MinimumQuantityDialog";
import { Image } from "expo-image";
import { formatPrice } from "@/core/utils";

interface ProductCardProps {
  product: Product;
  replaceNavigation?: boolean;
  index?: number;
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

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageUrl = useMemo(() => getValidImageUrl(product.image), [product.image]);

  const handleCardPress = () => {
    if (replaceNavigation) {
      router.replace(`/product/${product.id}`);
    } else {
      safePush(`/product/${product.id}`);
    }
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
    <View style={{ width: '100%' }}>
      <TouchableOpacity
        onPress={handleCardPress}
        activeOpacity={0.9}
        style={{
          backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
          borderRadius: 16,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.3 : 0.06,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        {/* Resim Container */}
        <View
          style={{
            aspectRatio: 1,
            backgroundColor: "transparent",
            position: "relative",
            alignItems: "center",
            justifyContent: "center",
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
              recyclingKey={`product-${product.id}`}
            />
          ) : null}

          {(!imageLoaded || imageError || !imageUrl) && (
            <View
              style={{
                position: "absolute",
                inset: 0,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="image-outline"
                size={32}
                color={isDark ? "#404040" : "#d4d4d4"}
              />
            </View>
          )}

          {/* Favori Button - Sol üst */}
          <View style={{ position: "absolute", top: 8, left: 8 }}>
            <HapticIconButton
              onPress={handleToggleFavorite}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: isDark
                  ? "rgba(0, 0, 0, 0.5)"
                  : "rgba(255, 255, 255, 0.9)",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(10px)",
              }}
            >
              <Ionicons
                name={isProductFavorite ? "heart" : "heart-outline"}
                size={18}
                color={isProductFavorite ? "#ef4444" : isDark ? "#ffffff" : "#404040"}
              />
            </HapticIconButton>
          </View>

          {/* Sepete Ekle Button - Sağ üst */}
          {!isOutOfStock && (
            <View style={{ position: "absolute", top: 8, right: 8 }}>
              <HapticIconButton
                onPress={(e) => {
                  if (e) handleAddToCart(e);
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="add" size={20} color="#ffffff" />
              </HapticIconButton>

              {cartQuantity > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: "#ef4444",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 4,
                    borderWidth: 2,
                    borderColor: isDark ? "#1a1a1a" : "#ffffff",
                  }}
                >
                  <ThemedText
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: "#ffffff",
                      lineHeight: 12,
                    }}
                  >
                    {cartQuantity}
                  </ThemedText>
                </View>
              )}
            </View>
          )}

          {/* Stok Durumu Badge - Sol alt */}
          {isLowStock && !isOutOfStock && (
            <View
              style={{
                position: "absolute",
                bottom: 8,
                left: 8,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
                backgroundColor: isDark
                  ? "rgba(251, 191, 36, 0.2)"
                  : "rgba(251, 191, 36, 0.1)",
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <View
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "#fbbf24",
                }}
              />
              <ThemedText
                style={{
                  fontSize: 10,
                  fontWeight: "600",
                  color: "#fbbf24",
                }}
              >
                {product.stock} {t("product.left")}
              </ThemedText>
            </View>
          )}

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <View
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                }}
              >
                <ThemedText
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: "#1a1a1a",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {t("product.out_of_stock")}
                </ThemedText>
              </View>
            </View>
          )}
        </View>

        {/* İçerik Container */}
        <View style={{ padding: 12 }}>
          {/* Ürün Adı */}
          <ThemedText
            numberOfLines={2}
            style={{
              fontSize: 13,
              fontWeight: "600",
              lineHeight: 18,
              color: isDark ? "#ffffff" : "#1a1a1a",
              marginBottom: 6,
              minHeight: 36,
            }}
          >
            {product.name}
          </ThemedText>

          {/* Fiyat ve Boyut */}
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

            {product.size && (
              <ThemedText
                style={{
                  fontSize: 11,
                  fontWeight: "500",
                  color: isDark ? "#737373" : "#a3a3a3",
                }}
              >
                {product.size}
              </ThemedText>
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

//  "ProductListItem.tsx"
//  metropolitan app
//  Created by Ahmet on 30.09.2025.

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

// Helper function to ensure valid image URL
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
    handleAddToCart,
    handleToggleFavorite,
  } = useProductCard(product);
  const { t } = useTranslation();
  const router = useRouter();
  const { push: safePush } = useNavigationProtection({ debounceTime: 700 });
  const [imageError, setImageError] = useState(false);

  const imageUrl = useMemo(() => getValidImageUrl(product.image), [product.image]);

  const handlePress = () => {
    safePush(`/product/${product.id}`);
  };

  const handleAddToCartWithEvent = async (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    await handleAddToCart(e);
  };

  const handleToggleFavoriteWithEvent = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    handleToggleFavorite(e);
  };

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageError(false);
  }, []);

  return (
    <View className="mx-4 mb-3">
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        className="flex-row overflow-hidden border"
        style={{
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          shadowColor: colorScheme === "dark" ? "#000" : colors.tint,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
          padding: 12,
          borderRadius: 20,
        }}
      >
        {/* Image */}
        <View
          style={{
            width: 80,
            height: 80,
            backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff',
            borderRadius: 8,
            position: 'relative',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
          }}
        >
          {!imageError && imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{
                width: '85%',
                height: '85%',
              }}
              contentFit="contain"
              transition={300}
              cachePolicy="none"
              priority="high"
              placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
              placeholderContentFit="contain"
              allowDownscaling={false}
              contentPosition="center"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          ) : (
            <Ionicons
              name="image-outline"
              size={32}
              color={colorScheme === "dark" ? "#666" : "#ccc"}
            />
          )}
          {isOutOfStock && (
            <View
              className="absolute inset-0 items-center justify-center"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.6)", borderRadius: 8 }}
            >
              <ThemedText className="text-xs font-bold" style={{ color: '#fff' }}>
                {t("product.out_of_stock")}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={{ flex: 1, justifyContent: 'flex-start' }}>
          {/* Product Name */}
          <ThemedText
            className="text-base font-semibold mb-0.5"
            numberOfLines={2}
            style={{
              color: colorScheme === "dark" ? "#ffffff" : "#000000",
            }}
          >
            {product.name}
          </ThemedText>

          {/* Brand and Size */}
          <ThemedText
            className="text-sm mb-1"
            style={{
              color: colors.mediumGray,
            }}
          >
            {product.brand} • {product.size}
          </ThemedText>

          {/* Bottom Row - Price and Stock */}
          <View className="flex-row items-center justify-between">
            {/* Price */}
            <ThemedText
              className="text-base font-bold"
              style={{
                color: colors.text,
              }}
            >
              {formatPrice(product.price, product.currency)}
            </ThemedText>

            {/* Stock Status */}
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

        {/* Action Buttons - Add to Cart & Favorite */}
        <View style={{ flexDirection: "column", alignItems: "center", marginLeft: 8, gap: 8 }}>
          {/* Add to Cart Button */}
          {!isOutOfStock && (
            <HapticIconButton
              onPress={handleAddToCartWithEvent}
              className="rounded-full justify-center items-center"
              style={{
                backgroundColor: colors.primary,
                width: 36,
                height: 36,
              }}
            >
              <Ionicons
                name="add"
                size={20}
                color="#fff"
                style={{ fontWeight: 'bold' }}
              />
            </HapticIconButton>
          )}

          {/* Favorite Toggle Button */}
          <HapticIconButton
            onPress={handleToggleFavoriteWithEvent}
            className="rounded-full justify-center items-center"
            style={{
              backgroundColor: isProductFavorite ? '#EF444420' : colors.cardBackground,
              width: 36,
              height: 36,
              borderWidth: 1,
              borderColor: isProductFavorite ? '#EF4444' : colors.border,
            }}
          >
            <Ionicons
              name={isProductFavorite ? "heart" : "heart-outline"}
              size={18}
              color={isProductFavorite ? "#EF4444" : colors.text}
            />
          </HapticIconButton>
        </View>
      </TouchableOpacity>
    </View>
  );
});
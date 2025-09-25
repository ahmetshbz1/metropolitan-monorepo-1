//  "ProductCard.tsx"
//  metropolitan app
//  Created by Ahmet on 30.06.2025. Edited on 23.07.2025.

import { ThemedText } from "@/components/ThemedText";
import { Product } from "@/context/ProductContext";
import { useProductCard } from "@/hooks/useProductCard";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity, View, Share } from "react-native";
import { useTranslation } from "react-i18next";
import ContextMenu from "react-native-context-menu-view";
import * as Haptics from "expo-haptics";
import { HapticIconButton } from "../HapticButton";
import { ProductCardContent } from "./ProductCardContent";
import { ProductCardImage } from "./ProductCardImage";

interface ProductCardProps {
  product: Product;
  variant?: "grid" | "horizontal";
}

// Helper function to determine favorite icon color
const getFavoriteIconColor = (
  isFavorite: boolean,
  colorScheme: string,
  colors: any
): string => {
  if (isFavorite) return colors.danger;
  return colorScheme === "dark" ? "#fff" : "#000";
};

export const ProductCard = React.memo<ProductCardProps>(function ProductCard({
  product,
  variant = "grid",
}) {
  const {
    colors,
    colorScheme,
    isProductFavorite,
    categoryName,
    isLowStock,
    isOutOfStock,
    handleAddToCart,
    handleToggleFavorite,
  } = useProductCard(product);
  const { t } = useTranslation();
  const router = useRouter();

  const isHorizontal = variant === "horizontal";

  // Context menu handlers
  const handleShare = async () => {
    try {
      await Share.share({
        message: `${product.name} - ${t("product_detail.share.check_out_this_product")}`,
        title: product.name,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleContextMenu = (index: number) => {
    switch (index) {
      case 0: // Sepete ekle
        if (!isOutOfStock) {
          handleAddToCart();
        }
        break;
      case 1: // Favori ekle/çıkar
        handleToggleFavorite();
        break;
      case 2: // Paylaş
        handleShare();
        break;
      case 3: // Detayları gör
        router.push(`/product/${product.id}`);
        break;
    }
  };

  const contextMenuActions = [
    {
      title: isOutOfStock ? t("product_detail.out_of_stock") : t("product_card.add_to_cart"),
      systemIcon: "cart",
      disabled: isOutOfStock,
      destructive: false,
    },
    {
      title: isProductFavorite ? t("product_card.remove_from_favorites") : t("product_card.add_to_favorites"),
      systemIcon: isProductFavorite ? "heart.fill" : "heart",
      destructive: false,
    },
    {
      title: t("product_card.share"),
      systemIcon: "square.and.arrow.up",
      destructive: false,
    },
    {
      title: t("product_card.view_details"),
      systemIcon: "info.circle",
      destructive: false,
    },
  ];

  return (
    <View
      className={isHorizontal ? "mr-3" : "mb-3"}
      style={isHorizontal ? { width: 180 } : { flex: 1/3 }}
    >
      <ContextMenu
        actions={contextMenuActions}
        onPress={(e) => {
          handleContextMenu(e.nativeEvent.index);
        }}
        onPreviewPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
        previewBackgroundColor={colors.cardBackground}
      >
        <Link
          href={{
            pathname: "/product/[id]",
            params: { id: product.id },
          }}
          asChild
        >
          <TouchableOpacity
            activeOpacity={0.85}
            className="overflow-hidden rounded-3xl border"
            style={{
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
              shadowColor: colorScheme === "dark" ? "#000" : colors.tint,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: colorScheme === "dark" ? 0.3 : 0.12,
              shadowRadius: 12,
              elevation: 6,
            }}
          >

          <ProductCardImage
            product={product}
            colorScheme={colorScheme}
            isOutOfStock={isOutOfStock}
            colors={colors}
          />

          <ProductCardContent
            product={product}
            categoryName={categoryName}
            colorScheme={colorScheme}
            colors={colors}
            isOutOfStock={isOutOfStock}
            isLowStock={isLowStock}
            handleAddToCart={handleAddToCart}
          />

          <HapticIconButton
            onPress={handleToggleFavorite}
            className="absolute top-1 right-3 w-8 h-8 justify-center items-center z-10"
          >
            <Ionicons
              name={isProductFavorite ? "heart" : "heart-outline"}
              size={20}
              color={getFavoriteIconColor(isProductFavorite, colorScheme, colors)}
            />
          </HapticIconButton>
        </TouchableOpacity>
      </Link>
      </ContextMenu>
    </View>
  );
});

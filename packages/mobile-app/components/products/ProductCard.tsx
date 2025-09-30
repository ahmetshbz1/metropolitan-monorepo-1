//  "ProductCard.tsx"
//  metropolitan app
//  Created by Ahmet on 30.06.2025. Edited on 23.07.2025.

import { ThemedText } from "@/components/ThemedText";
import { Product } from "@/context/ProductContext";
import { useProductCard } from "@/hooks/useProductCard";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useNavigationProtection } from "@/hooks/useNavigationProtection";
import React from "react";
import { TouchableOpacity, View, Share, Dimensions } from "react-native";
import { useTranslation } from "react-i18next";
import ContextMenu from "react-native-context-menu-view";
import * as Haptics from "expo-haptics";
import { HapticIconButton } from "../HapticButton";
import { ProductCardContent } from "./ProductCardContent";
import { ProductCardImage } from "./ProductCardImage";

const SCREEN_WIDTH = Dimensions.get('window').width;
const NUM_COLUMNS = 3;
const CARD_PADDING = 12;
const COLUMN_GAP = 8;
const CARD_WIDTH = (SCREEN_WIDTH - (CARD_PADDING * 2) - (COLUMN_GAP * (NUM_COLUMNS - 1))) / NUM_COLUMNS;

interface ProductCardProps {
  product: Product;
  replaceNavigation?: boolean;
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
  replaceNavigation = false,
}) {
  const {
    colors,
    colorScheme,
    isProductFavorite,
    categoryName,
    isLowStock,
    isOutOfStock,
    displayPrice,
    handleAddToCart,
    handleToggleFavorite,
  } = useProductCard(product);
  const { t } = useTranslation();
  const router = useRouter();
  const { push: safePush } = useNavigationProtection({ debounceTime: 700 });
  const suppressNextPressRef = React.useRef(false);

  // Context menu handlers
  const handleShare = async () => {
    try {
      await Share.share({
        message: `${product.name} - ${t("product_detail.share.check_out_this_product")}`,
        title: product.name,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Removed console statement
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
        if (replaceNavigation) {
          router.replace(`/product/${product.id}`);
        } else {
          safePush(`/product/${product.id}`);
        }
        break;
    }
  };

  const handleCardPress = () => {
    if (suppressNextPressRef.current) {
      suppressNextPressRef.current = false;
      return;
    }

    if (replaceNavigation) {
      router.replace(`/product/${product.id}`);
    } else {
      safePush(`/product/${product.id}`);
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
    <View style={{ width: CARD_WIDTH }}>
      <ContextMenu
        actions={contextMenuActions}
        onPress={(e) => {
          suppressNextPressRef.current = true;
          handleContextMenu(e.nativeEvent.index);
        }}
        onCancel={() => {
          suppressNextPressRef.current = true;
        }}
        onPreviewPress={() => {
          suppressNextPressRef.current = true;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
        previewBackgroundColor={colors.cardBackground}
      >
          <TouchableOpacity
            onPress={handleCardPress}
            onLongPress={() => {
              suppressNextPressRef.current = true;
            }}
            delayLongPress={500}
            activeOpacity={0.85}
            className="overflow-hidden rounded-xl border"
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

          <ProductCardImage
            product={product}
            colorScheme={colorScheme}
            isOutOfStock={isOutOfStock}
            colors={colors}
            isProductFavorite={isProductFavorite}
            handleToggleFavorite={handleToggleFavorite}
            handleAddToCart={handleAddToCart}
          />

          <ProductCardContent
            product={product}
            categoryName={categoryName}
            colorScheme={colorScheme}
            colors={colors}
            isOutOfStock={isOutOfStock}
            isLowStock={isLowStock}
            displayPrice={displayPrice}
            handleAddToCart={handleAddToCart}
          />
        </TouchableOpacity>
      </ContextMenu>
    </View>
  );
});

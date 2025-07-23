//  "ProductCard.tsx"
//  metropolitan app
//  Created by Ahmet on 30.06.2025. Edited on 23.07.2025.

import { Product } from "@/context/ProductContext";
import { useProductCard } from "@/hooks/useProductCard";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { HapticIconButton } from "../HapticButton";
import { ProductCardContent } from "./ProductCardContent";
import { ProductCardImage } from "./ProductCardImage";

interface ProductCardProps {
  product: Product;
  variant?: 'grid' | 'horizontal';
}

export const ProductCard = React.memo<ProductCardProps>(function ProductCard({
  product,
  variant = 'grid',
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

  const isHorizontal = variant === 'horizontal';
  
  return (
    <View 
      className={isHorizontal ? "mr-3" : "mx-1 mb-3"} 
      style={isHorizontal ? { width: 180 } : { width: '48%' }}
    >
      <Link
        href={{
          pathname: "/product/[id]",
          params: { id: product.id },
        }}
        asChild
      >
        <TouchableOpacity
          activeOpacity={0.9}
          className={`
            overflow-hidden rounded-2xl
            ${colorScheme === 'dark' 
              ? 'bg-neutral-900 border border-neutral-800' 
              : 'bg-white border-0'
            }
            ${isOutOfStock ? 'opacity-70' : ''}
          `}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: colorScheme === 'dark' ? 0.2 : 0.08,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          {/* Image Section */}
          <ProductCardImage
            product={product}
            colorScheme={colorScheme}
            isOutOfStock={isOutOfStock}
            colors={colors}
          />

          {/* Content Section */}
          <ProductCardContent
            product={product}
            categoryName={categoryName}
            colorScheme={colorScheme}
            colors={colors}
            isOutOfStock={isOutOfStock}
            isLowStock={isLowStock}
            handleAddToCart={handleAddToCart}
          />

          {/* Modern Floating Favorite Button */}
          <HapticIconButton
            onPress={handleToggleFavorite}
            className={`
              absolute top-3 right-3 w-10 h-10 justify-center items-center z-10 rounded-full
              ${colorScheme === 'dark' 
                ? 'bg-neutral-800/90' 
                : 'bg-white/90'
              }
            `}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
            hapticType="light"
          >
            <Ionicons
              name={isProductFavorite ? "heart" : "heart-outline"}
              size={18}
              color={
                isProductFavorite
                  ? colors.danger
                  : colorScheme === "dark"
                    ? "#888"
                    : "#666"
              }
            />
          </HapticIconButton>
        </TouchableOpacity>
      </Link>
    </View>
  );
});

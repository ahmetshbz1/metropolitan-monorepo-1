//  "ProductCardActions.tsx"
//  metropolitan app
//  Created by Ahmet on 29.06.2025.

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ColorSchemeName, TouchableOpacity, Text } from "react-native";
import { HapticIconButton } from "../HapticButton";

interface ProductCardActionsProps {
  colors: any;
  colorScheme: ColorSchemeName;
  isOutOfStock: boolean;
  isProductFavorite: boolean;
  handleAddToCart: (e: any) => void;
  handleToggleFavorite: () => void;
  handleNotifyRequest?: () => void;
}

export const ProductCardActions: React.FC<ProductCardActionsProps> = ({
  colors,
  colorScheme,
  isOutOfStock,
  isProductFavorite,
  handleAddToCart,
  handleToggleFavorite,
  handleNotifyRequest,
}) => {
  return (
    <>
      {!isOutOfStock ? (
        // Add to Cart Button
        <TouchableOpacity
          className="w-11 h-11 rounded-full items-center justify-center"
          style={{
            backgroundColor: colors.tint,
            shadowColor: colors.tint,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.25,
            shadowRadius: 6,
            elevation: 3,
          }}
          onPress={handleAddToCart}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      ) : (
        // Notify Button when out of stock
        <TouchableOpacity
          className="px-3 py-2 rounded-full items-center justify-center"
          style={{
            backgroundColor: colorScheme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
            borderWidth: 1,
            borderColor: colorScheme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)",
          }}
          onPress={handleNotifyRequest}
        >
          <Text 
            className="text-xs font-medium"
            style={{ 
              color: colorScheme === "dark" ? "rgba(255, 255, 255, 0.7)" : colors.darkGray 
            }}
          >
            Haber Ver
          </Text>
        </TouchableOpacity>
      )}
    </>
  );
};

// Separate component for favorite button
interface FavoriteButtonProps {
  colors: any;
  colorScheme: ColorSchemeName;
  isProductFavorite: boolean;
  handleToggleFavorite: () => void;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  colors,
  colorScheme,
  isProductFavorite,
  handleToggleFavorite,
}) => {
  return (
    <HapticIconButton
      onPress={handleToggleFavorite}
      className="absolute top-3 right-3 w-8 h-8 justify-center items-center z-10"
      style={{
        backgroundColor: isProductFavorite
          ? colors.danger
          : colorScheme === "dark"
            ? "rgba(255, 255, 255, 0.15)"
            : "rgba(255, 255, 255, 0.9)",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: isProductFavorite
          ? colors.danger
          : colorScheme === "dark"
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(255, 255, 255, 0.5)",
        shadowColor: isProductFavorite ? colors.danger : "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: isProductFavorite ? 0.25 : 0.08,
        shadowRadius: 6,
        elevation: 3,
      }}
      hapticType="light"
    >
      <Ionicons
        name={isProductFavorite ? "heart" : "heart-outline"}
        size={16}
        color={
          isProductFavorite
            ? "#fff"
            : colorScheme === "dark"
              ? "rgba(255, 255, 255, 0.8)"
              : colors.darkGray
        }
      />
    </HapticIconButton>
  );
};

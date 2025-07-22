//  "cartItemStyles.ts"
//  metropolitan app
//  Created by Ahmet on 02.06.2025.

import { ColorSchemeName } from "react-native";

export const getCartItemGradientColors = (
  colorScheme: ColorSchemeName,
  colors: any
): [string, string] => {
  return colorScheme === "dark"
    ? [colors.card, colors.cardBackground]
    : ["#FFFFFF", "#F8F9FA"];
};

export const getCartItemShadowStyle = () => ({
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 5,
  elevation: 4,
});

export const getSwipeActionStyle = () => ({
  width: 80,
});

export const getQuantityControlStyle = (colors: any) => ({
  borderColor: colors.borderColor,
});

export const getQuantityButtonStyle = (colors: any) => ({
  borderLeftWidth: 1,
  borderRightWidth: 1,
  borderColor: colors.borderColor,
  paddingHorizontal: 12,
});

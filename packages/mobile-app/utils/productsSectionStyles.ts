//  "productsSectionStyles.ts"
//  metropolitan app
//  Created by Ahmet on 13.06.2025.

import { StyleSheet } from "react-native";
import type { ThemeColors } from "@/types/theme";

export const createProductsSectionStyles = (colors: ThemeColors) => ({
  container: {
    backgroundColor: colors.cardBackground,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollView: (itemsLength: number) => ({
    maxHeight: itemsLength > 4 ? 340 : undefined,
  }),
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
    backgroundColor: "#f8f8f8",
  },
  quantityText: {
    color: "#888",
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  totalItemsText: {
    color: "#555",
  },
});

export const PRODUCTS_SECTION_CONFIG = {
  maxItemsBeforeScroll: 4,
  imageSize: 60,
  borderRadius: 8,
} as const;

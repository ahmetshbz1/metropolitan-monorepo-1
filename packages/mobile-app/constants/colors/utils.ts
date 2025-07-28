//  "utils.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import type { ThemeColors } from "@/types/theme";
import type { TranslationFunction } from "@/types/i18n";

// Renk yardımcı fonksiyonları
export const ColorUtils = {
  // Opacity ekleme
  withOpacity: (color: string, opacity: number) =>
    `${color}${Math.round(opacity * 255)
      .toString(16)
      .padStart(2, "0")}`,

  // Hex to RGB dönüştürme
  hexToRgb: (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  },

  // RGB to Hex dönüştürme
  rgbToHex: (r: number, g: number, b: number) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  },
};

// Status Badge yardımcı fonksiyonları
export const StatusUtils = {
  // Status badge renklerini al
  getStatusColor: (status: string, colors: ThemeColors) => {
    switch (status.toLowerCase()) {
      case "pending":
        return { bg: colors.orderPending, text: colors.cardBackground };
      case "processing":
        return { bg: colors.orderProcessing, text: colors.cardBackground };
      case "shipped":
        return { bg: colors.orderShipped, text: colors.cardBackground };
      case "delivered":
        return { bg: colors.orderDelivered, text: colors.cardBackground };
      case "cancelled":
        return { bg: colors.orderCancelled, text: colors.cardBackground };
      default:
        return { bg: colors.secondaryBackground, text: colors.text };
    }
  },

  // Status çevirisini al
  getStatusText: (status: string, t: TranslationFunction) => {
    switch (status.toLowerCase()) {
      case "pending":
        return t("order.status.pending");
      case "confirmed":
        return t("order.status.confirmed");
      case "preparing":
        return t("order.status.preparing");
      case "shipped":
        return t("order.status.shipped");
      case "delivered":
        return t("order.status.delivered");
      case "cancelled":
        return t("order.status.cancelled");
      default:
        return status;
    }
  },
};
//  "utils.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

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
  getStatusColor: (status: string, colors: any) => {
    const statusKey = status.toLowerCase() as keyof typeof colors.statusBadge;

    if (colors.statusBadge && colors.statusBadge[statusKey]) {
      return {
        bg: colors.statusBadge[statusKey].background,
        text: colors.statusBadge[statusKey].text,
      };
    }

    // Fallback for unknown status
    return { bg: colors.lightGray, text: colors.text };
  },

  // Status çevirisini al
  getStatusText: (status: string, t: any) => {
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
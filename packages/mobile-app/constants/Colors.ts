//  "Colors.ts"
//  metropolitan app
//  Created by Ahmet on 09.07.2025.

/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

/**
 * Premium Avrupa/Polonya renk sistemi - Zalando kalitesinde
 * Modern e-ticaret uygulaması için tasarlanmış profesyonel renk paleti
 */

// Ana turuncu renkler
const PRIMARY_ORANGE = "#FF6900"; // Ana turuncu (Zalando tarzı)
const PRIMARY_ORANGE_DARK = "#FF7A1A"; // Dark mode karşılığı (daha canlı)

export default {
  light: {
    // Ana renkler
    text: "#1A1A1A", // Ultra koyu, saf siyah değil
    textSecondary: "#8E8E93", // iOS tarzı gri
    textMuted: "#C7C7CC", // Çok açık gri
    background: "#F8F9FA", // Hafif gri (kartların görünmesi için)
    backgroundSecondary: "#FAFAFA", // Facebook tarzı açık gri

    // Tema renkleri
    tint: PRIMARY_ORANGE, // Ana turuncu
    tintLight: "#FFE4CC", // Açık turuncu
    tintDark: "#E55A00", // Koyu turuncu

    // İkon renkleri
    icon: "#8E8E93",
    tabIconDefault: "#8E8E93",
    tabIconSelected: PRIMARY_ORANGE,

    // Durum renkleri
    success: "#4CAF50", // Material Design yeşil
    warning: "#FF9800", // Material Design turuncu
    danger: "#F44336", // Material Design kırmızı
    info: "#2196F3", // Material Design mavi

    // Status Badge Renkleri
    statusBadge: {
      pending: {
        background: "#FEF3C7", // Açık sarı
        text: "#D97706", // Koyu sarı
      },
      confirmed: {
        background: "#DBEAFE", // Açık mavi
        text: "#2563EB", // Koyu mavi
      },
      preparing: {
        background: "#FED7AA", // Açık turuncu
        text: "#C2410C", // Koyu turuncu
      },
      shipped: {
        background: "#E0E7FF", // Açık indigo
        text: "#6366F1", // Koyu indigo
      },
      delivered: {
        background: "#D1FAE5", // Açık yeşil
        text: "#059669", // Koyu yeşil
      },
      cancelled: {
        background: "#FEE2E2", // Açık kırmızı
        text: "#DC2626", // Koyu kırmızı
      },
    },

    // Gri skalası (B2B için kritik)
    gray50: "#F9FAFB",
    gray100: "#F3F4F6",
    gray200: "#E5E7EB",
    gray300: "#D1D5DB",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    gray600: "#4B5563",
    gray700: "#374151",
    gray800: "#1F2937",
    gray900: "#111827",

    // Kart ve sınır renkleri
    card: "#FFFFFF",
    cardBackground: "#FFFFFF",
    border: "#E5E7EB",
    borderColor: "#E5E7EB",
    disabled: "#D1D5DB",

    // Eski sistemle uyumluluk
    lightGray: "#F3F4F6",
    mediumGray: "#8E8E93",
    darkGray: "#374151",
  },
  dark: {
    // Dark mode - Instagram/Twitter kalitesinde
    text: "#FFFFFF", // Saf beyaz
    textSecondary: "#9CA3AF", // Orta gri
    textMuted: "#6B7280", // Koyu gri
    background: "#000000", // Instagram tarzı saf siyah
    backgroundSecondary: "#1C1C1E", // iOS tarzı koyu gri

    // Tema renkleri
    tint: PRIMARY_ORANGE_DARK, // Dark mode turuncu
    tintLight: "#FF9547", // Açık turuncu (dark mode) - daha parlak
    tintDark: "#E55A00", // Koyu turuncu (dark mode)

    // İkon renkleri
    icon: "#9CA3AF",
    tabIconDefault: "#9CA3AF",
    tabIconSelected: PRIMARY_ORANGE_DARK,

    // Dark mode durum renkleri (daha yumuşak)
    success: "#10B981", // Tailwind emerald-500 (biraz daha parlak)
    warning: "#D97706", // Tailwind amber-600 (daha koyu)
    danger: "#DC2626", // Tailwind red-600 (daha koyu)
    info: "#2563EB", // Tailwind blue-600 (daha koyu)

    // Status Badge Renkleri (Dark Mode)
    statusBadge: {
      pending: {
        background: "#FEF3C7", // Aynı açık sarı (dark mode'da da güzel)
        text: "#92400E", // Koyu sarı yazı
      },
      confirmed: {
        background: "#3B82F6", // Canlı mavi arkaplan
        text: "#FFFFFF", // Beyaz yazı
      },
      preparing: {
        background: "#F97316", // Canlı turuncu arkaplan
        text: "#FFFFFF", // Beyaz yazı
      },
      shipped: {
        background: "#8B5CF6", // Canlı mor arkaplan
        text: "#FFFFFF", // Beyaz yazı
      },
      delivered: {
        background: "#10B981", // Canlı yeşil arkaplan
        text: "#FFFFFF", // Beyaz yazı
      },
      cancelled: {
        background: "#EF4444", // Canlı kırmızı arkaplan
        text: "#FFFFFF", // Beyaz yazı
      },
    },

    // Gri skalası (dark mode)
    gray50: "#111827",
    gray100: "#1F2937",
    gray200: "#374151",
    gray300: "#4B5563",
    gray400: "#6B7280",
    gray500: "#9CA3AF",
    gray600: "#D1D5DB",
    gray700: "#E5E7EB",
    gray800: "#F3F4F6",
    gray900: "#F9FAFB",

    // Kart ve sınır renkleri
    card: "#1C1C1E",
    cardBackground: "#1C1C1E",
    border: "#2C2C2E",
    borderColor: "#2C2C2E",
    disabled: "#4B5563",

    // Eski sistemle uyumluluk
    lightGray: "#4B5563",
    mediumGray: "#9CA3AF",
    darkGray: "#F3F4F6",
  },
};

// 🌈 Gradient System
export const gradients = {
  // Ana gradient'ler
  primary: [PRIMARY_ORANGE, "#E55A00"],
  primaryDark: [PRIMARY_ORANGE_DARK, "#CC5200"],
  commerce: [PRIMARY_ORANGE, "#FF8533"],
  premium: [PRIMARY_ORANGE, "#1A1A1A"],

  // Fonksiyonel gradient'ler
  success: ["#56AB2F", "#A8E6CF"],
  successDark: ["#10B981", "#059669"],
  warning: ["#FFB75E", "#ED8F03"],
  warningDark: ["#F59E0B", "#D97706"],
  danger: ["#FF512F", "#DD2476"],
  dangerDark: ["#EF4444", "#DC2626"],

  // Özel gradient'ler
  ocean: ["#667EEA", "#764BA2"],
  sunset: ["#FEA858", "#FED057"],
  royal: ["#8360C3", "#2EBF91"],

  // E-ticaret özel gradient'leri
  shopping: [PRIMARY_ORANGE, "#FF8533", "#FFB366"],
  premiumGold: ["#FF6900", "#1A1A1A"],
  gold: ["#FFD700", "#FFA500"],
  silver: ["#C0C0C0", "#808080"],
};

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

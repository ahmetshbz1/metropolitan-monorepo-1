//  "theme.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

// Ana turuncu renkler
export const PRIMARY_ORANGE = "#FF6900"; // Ana turuncu (Zalando tarzı)
export const PRIMARY_ORANGE_DARK = "#FF7A1A"; // Dark mode karşılığı (daha canlı)

// Tema renk tanımları
export const lightTheme = {
  // Ana renkler
  primary: PRIMARY_ORANGE, // Ana buton rengi
  primaryForeground: "#FFFFFF", // Buton text rengi (beyaz)
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
  error: "#F44336", // Danger alias
  info: "#2196F3", // Material Design mavi

  // Kart ve sınır renkleri
  card: "#FFFFFF",
  cardBackground: "#FFFFFF",
  border: "#E5E7EB",
  borderColor: "#E5E7EB",
  disabled: "#D1D5DB",
  mutedForeground: "#8E8E93", // Disabled text color

  // Eski sistemle uyumluluk
  lightGray: "#F3F4F6",
  mediumGray: "#8E8E93",
  darkGray: "#374151",
};

export const darkTheme = {
  // Dark mode - Instagram/Twitter kalitesinde
  primary: PRIMARY_ORANGE_DARK, // Ana buton rengi
  primaryForeground: "#FFFFFF", // Buton text rengi (beyaz)
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
  error: "#DC2626", // Danger alias
  info: "#2563EB", // Tailwind blue-600 (daha koyu)

  // Kart ve sınır renkleri
  card: "#1C1C1E",
  cardBackground: "#1C1C1E",
  border: "#2C2C2E",
  borderColor: "#2C2C2E",
  disabled: "#4B5563",
  mutedForeground: "#9CA3AF", // Disabled text color

  // Eski sistemle uyumluluk
  lightGray: "#4B5563",
  mediumGray: "#9CA3AF",
  darkGray: "#F3F4F6",
};
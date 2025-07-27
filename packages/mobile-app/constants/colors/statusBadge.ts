//  "statusBadge.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

export const lightStatusBadge = {
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
};

export const darkStatusBadge = {
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
};
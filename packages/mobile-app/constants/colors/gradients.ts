//  "gradients.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import { PRIMARY_ORANGE, PRIMARY_ORANGE_DARK } from "./theme";

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
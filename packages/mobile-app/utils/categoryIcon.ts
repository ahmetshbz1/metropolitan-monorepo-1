//  "categoryIcon.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import { Ionicons } from "@expo/vector-icons";

// Kategori slug'larına göre ikon mapping'i
export const getCategoryIcon = (
  slug: string,
  name: string
): keyof typeof Ionicons.glyphMap => {
  const normalizedSlug = slug.toLowerCase();
  const normalizedName = name.toLowerCase();

  // Elektronik kategorileri
  if (
    normalizedSlug.includes("elektronik") ||
    normalizedSlug.includes("electronic") ||
    normalizedName.includes("elektronik") ||
    normalizedName.includes("electronic")
  ) {
    return "hardware-chip-outline";
  }

  // Telefon/Mobil kategorileri
  if (
    normalizedSlug.includes("telefon") ||
    normalizedSlug.includes("phone") ||
    normalizedSlug.includes("mobile") ||
    normalizedName.includes("telefon")
  ) {
    return "phone-portrait-outline";
  }

  // Bilgisayar kategorileri
  if (
    normalizedSlug.includes("bilgisayar") ||
    normalizedSlug.includes("computer") ||
    normalizedSlug.includes("laptop") ||
    normalizedName.includes("bilgisayar")
  ) {
    return "laptop-outline";
  }

  // Giyim kategorileri
  if (
    normalizedSlug.includes("giyim") ||
    normalizedSlug.includes("clothing") ||
    normalizedSlug.includes("fashion") ||
    normalizedName.includes("giyim")
  ) {
    return "shirt-outline";
  }

  // Ev kategorileri
  if (
    normalizedSlug.includes("ev") ||
    normalizedSlug.includes("home") ||
    normalizedSlug.includes("house") ||
    normalizedName.includes("ev")
  ) {
    return "home-outline";
  }

  // Spor kategorileri
  if (
    normalizedSlug.includes("spor") ||
    normalizedSlug.includes("sport") ||
    normalizedSlug.includes("fitness") ||
    normalizedName.includes("spor")
  ) {
    return "fitness-outline";
  }

  // Kitap kategorileri
  if (
    normalizedSlug.includes("kitap") ||
    normalizedSlug.includes("book") ||
    normalizedName.includes("kitap")
  ) {
    return "book-outline";
  }

  // Oyuncak kategorileri
  if (
    normalizedSlug.includes("oyuncak") ||
    normalizedSlug.includes("toy") ||
    normalizedName.includes("oyuncak")
  ) {
    return "game-controller-outline";
  }

  // Kozmetik kategorileri
  if (
    normalizedSlug.includes("kozmetik") ||
    normalizedSlug.includes("beauty") ||
    normalizedSlug.includes("cosmetic") ||
    normalizedName.includes("kozmetik")
  ) {
    return "flower-outline";
  }

  // Yiyecek kategorileri
  if (
    normalizedSlug.includes("yiyecek") ||
    normalizedSlug.includes("food") ||
    normalizedSlug.includes("gida") ||
    normalizedName.includes("yiyecek")
  ) {
    return "restaurant-outline";
  }

  // Varsayılan ikon
  return "apps-outline";
};

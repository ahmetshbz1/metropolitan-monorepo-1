//  "product.ts"
//  metropolitan app
//  Created by Ahmet on 15.07.2025.

export interface NutritionalValues {
  energy?: string; // kcal/100g
  fat?: string; // g/100g
  saturatedFat?: string; // g/100g
  carbohydrates?: string; // g/100g
  sugar?: string; // g/100g
  protein?: string; // g/100g
  salt?: string; // g/100g
}

export interface ManufacturerInfo {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  stock: number;
  category: string;
  brand: string;
  size?: string;
  currency?: string;
  description?: string;
  // Yeni eklenen detay alanları
  allergens?: string; // Alerjen maddeler listesi
  nutritionalValues?: NutritionalValues; // Besin değerleri
  netQuantity?: string; // Net miktar (örn: 500g, 1L)
  expiryDate?: Date | string; // Son kullanma tarihi
  storageConditions?: string; // Saklama koşulları
  manufacturerInfo?: ManufacturerInfo; // Üretici bilgileri
  originCountry?: string; // Menşe ülkesi
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

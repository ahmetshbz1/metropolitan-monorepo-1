//  "cartNormalizers.ts"
//  metropolitan app
//  Created by Ahmet on 27.06.2025.

import { CartItem, CartSummary } from "@/types/cart";
import type { Product } from "@metropolitan/shared";

// Raw API response types
interface RawCartItem {
  id: string;
  quantity: number;
  createdAt?: string;
  totalPrice?: string | number;
  product: Partial<Product> & {
    productCode?: string;
    imageUrl?: string;
    image?: string;
    fullName?: string;
    description?: string;
  };
}

interface RawCartSummary {
  itemCount?: number;
  totalItems?: number;
  totalAmount: string | number;
  currency: string;
}

// Ürün fiyatını normalize et (string veya number olabilir)
export const normalizePrice = (price: string | number): number => {
  return typeof price === "string" ? parseFloat(price) : price;
};

// Cart item'ı normalize et (user ve guest endpoint'leri arasındaki farkları gider)
export const normalizeCartItem = (item: RawCartItem): CartItem => {
  return {
    id: item.id,
    quantity: item.quantity,
    createdAt: item.createdAt,
    totalPrice: item.totalPrice,
    product: {
      id: item.product.id || "",
      name: item.product.name || "",
      image: item.product.imageUrl || item.product.image || "",
      price: item.product.price || 0,
      stock: item.product.stock || 0,
      category: item.product.category || "",
      brand: item.product.brand || "",
      size: item.product.size,
      currency: item.product.currency,
    } as Product,
  };
};

// Summary'yi normalize et
export const normalizeSummary = (data: RawCartSummary): CartSummary => {
  return {
    totalItems: data.itemCount || data.totalItems || 0,
    totalAmount: data.totalAmount,
    currency: data.currency,
  };
};

// Guest cart response'unu normalize et
export const normalizeGuestCartResponse = (
  response: { data: { data: { items: RawCartItem[]; totalAmount: string | number; itemCount: number; currency: string } } }
): { items: CartItem[]; summary: CartSummary } => {
  const { items, totalAmount, itemCount, currency } = response.data.data;

  return {
    items: (items || []).map(normalizeCartItem),
    summary: {
      totalItems: itemCount || 0,
      totalAmount: totalAmount || 0,
      currency: currency,
    },
  };
};

// User cart response'unu normalize et
export const normalizeUserCartResponse = (
  response: { data: { items: RawCartItem[]; summary: RawCartSummary | null } }
): { items: CartItem[]; summary: CartSummary | null } => {
  const { items, summary } = response.data;

  return {
    items: (items || []).map(normalizeCartItem),
    summary: summary ? normalizeSummary(summary) : null,
  };
};

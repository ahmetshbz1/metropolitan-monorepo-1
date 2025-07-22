//  "cartNormalizers.ts"
//  metropolitan app
//  Created by Ahmet on 27.06.2025.

import { CartItem, CartSummary } from "@/types/cart";

// Ürün fiyatını normalize et (string veya number olabilir)
export const normalizePrice = (price: string | number): number => {
  return typeof price === "string" ? parseFloat(price) : price;
};

// Cart item'ı normalize et (user ve guest endpoint'leri arasındaki farkları gider)
export const normalizeCartItem = (item: any): CartItem => {
  return {
    id: item.id,
    quantity: item.quantity,
    createdAt: item.createdAt,
    totalPrice: item.totalPrice,
    product: {
      id: item.product.id,
      productCode: item.product.productCode,
      brand: item.product.brand,
      size: item.product.size,
      imageUrl: item.product.imageUrl || item.product.image,
      price: item.product.price,
      stock: item.product.stock,
      name: item.product.name,
      fullName: item.product.fullName,
      description: item.product.description,
    },
  };
};

// Summary'yi normalize et
export const normalizeSummary = (data: any): CartSummary => {
  return {
    totalItems: data.itemCount || data.totalItems,
    totalAmount: data.totalAmount,
    currency: data.currency,
  };
};

// Guest cart response'unu normalize et
export const normalizeGuestCartResponse = (
  response: any
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
  response: any
): { items: CartItem[]; summary: CartSummary | null } => {
  const { items, summary } = response.data;

  return {
    items: (items || []).map(normalizeCartItem),
    summary: summary ? normalizeSummary(summary) : null,
  };
};

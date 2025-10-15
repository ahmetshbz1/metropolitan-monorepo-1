//  "cart-item-mapper.ts"
//  metropolitan backend
//  Created by Ahmet on 26.06.2025.

import type { CartItem } from "@metropolitan/shared/types/cart";
import type { RawCartItem } from "./cart-item-types";

/**
 * Ham sepet verilerini CartItem tipine dönüştürür
 */
export function mapCartItem(
  item: RawCartItem,
  userType?: "individual" | "corporate"
): CartItem {
  // Kullanıcı tipine göre doğru fiyatı seç
  let finalPrice = Number(item.product.price);
  if (userType === "corporate" && item.product.corporatePrice) {
    finalPrice = Number(item.product.corporatePrice);
  } else if (userType === "individual" && item.product.individualPrice) {
    finalPrice = Number(item.product.individualPrice);
  }

  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
    product: {
      ...item.product,
      price: finalPrice,
      image: item.product.image || "",
      category: item.product.category || "",
      brand: item.product.brand || "",
      name: item.product.name || "",
      stock: item.product.stock || 0,
      size: item.product.size || undefined,
    },
  };
}

//  "cart-item-types.ts"
//  metropolitan backend
//  Created by Ahmet on 26.06.2025.

import type {
  CartItem,
  CartSummary,
} from "@metropolitan/shared/types/cart";
import {
  cartItems,
  productTranslations,
  products,
} from "../../../../shared/infrastructure/database/schema";

/**
 * Backend'e özel sepet response tipi
 */
export interface CartResponse {
  items: CartItem[];
  summary: CartSummary;
}

/**
 * Ürün çeviri satırı tipi
 */
export type ProductTranslationRow = typeof productTranslations.$inferSelect;

/**
 * Ham sepet öğesi verisi (DB'den gelen)
 */
export interface RawCartItem {
  id: string;
  quantity: number;
  createdAt: Date;
  product: {
    id: string;
    productCode: string;
    brand: string | null;
    size: string | null;
    image: string | null;
    price: string | null;
    individualPrice: string | null;
    corporatePrice: string | null;
    currency: string;
    stock: number;
    name: string | null;
    category: string | null;
  };
}

/**
 * Çevirilerle birlikte sepet öğesi tipi
 */
export type CartItemWithTranslations = typeof cartItems.$inferSelect & {
  product: (typeof products.$inferSelect) & {
    translations: ProductTranslationRow[];
  };
};

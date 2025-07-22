//  "cart-validation.service.ts"
//  metropolitan backend
//  Created by Ahmet on 21.06.2025.

import { and, eq } from "drizzle-orm";
import { db } from "../../../../shared/infrastructure/database/connection";
import {
  cartItems,
  products,
} from "../../../../shared/infrastructure/database/schema";

export class CartValidationService {
  /**
   * Ürünün varlığını ve stok durumunu kontrol eder
   */
  static async validateProduct(productId: string, requestedQuantity: number) {
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product.length) {
      throw new Error(
        JSON.stringify({
          key: "PRODUCT_NOT_FOUND",
        })
      );
    }

    const productData = product[0];
    const availableStock = productData.stock || 0;
    if (availableStock < requestedQuantity) {
      throw new Error(
        JSON.stringify({
          key: "INSUFFICIENT_STOCK",
          params: { stock: availableStock },
        })
      );
    }

    return productData;
  }

  /**
   * Sepete ekleme veya güncelleme için stok kontrolü yapar.
   * @param productId Kontrol edilecek ürünün ID'si
   * @param newTotalQuantity Sepetteki nihai toplam miktar
   * @param oldCartQuantity İşlem öncesi sepetteki miktar (yeni ürün için 0)
   */
  static async validateStock(
    productId: string,
    newTotalQuantity: number,
    oldCartQuantity: number = 0
  ) {
    const product = await db
      .select({ id: products.id, stock: products.stock })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product.length) {
      throw new Error(JSON.stringify({ key: "PRODUCT_NOT_FOUND" }));
    }

    const productData = product[0];
    const availableStock = productData.stock || 0;

    if (newTotalQuantity > availableStock) {
      if (oldCartQuantity > 0) {
        // Sepette ürün varken stok aşımı durumu
        throw new Error(
          JSON.stringify({
            key: "INSUFFICIENT_STOCK_ALREADY_IN_CART",
            params: {
              stock: availableStock,
              inCart: oldCartQuantity,
              canAdd: availableStock - oldCartQuantity,
            },
          })
        );
      } else {
        // Sepet boşken stok aşımı durumu
        throw new Error(
          JSON.stringify({
            key: "INSUFFICIENT_STOCK",
            params: { stock: availableStock },
          })
        );
      }
    }

    return productData;
  }

  /**
   * Sepet öğesinin kullanıcıya ait olduğunu kontrol eder
   */
  static async validateCartOwnership(itemId: string, userId: string) {
    const cartItem = await db
      .select({ id: cartItems.id })
      .from(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.userId, userId)))
      .limit(1);

    if (!cartItem.length) {
      throw new Error(
        JSON.stringify({
          key: "CART_ITEM_NOT_FOUND",
        })
      );
    }
  }

  /**
   * Mevcut sepet öğesini kontrol eder
   */
  static async getExistingCartItem(userId: string, productId: string) {
    const existingItem = await db
      .select()
      .from(cartItems)
      .where(
        and(eq(cartItems.userId, userId), eq(cartItems.productId, productId))
      )
      .limit(1);

    return existingItem.length > 0 ? existingItem[0] : null;
  }

  /**
   * Stok kontrolü yapar (mevcut sepet öğesi için)
   */
}

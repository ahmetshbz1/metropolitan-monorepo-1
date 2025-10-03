//  "cart-validation.service.ts"
//  metropolitan backend
//  Created by Ahmet on 21.06.2025.

import { and, eq } from "drizzle-orm";

import { db } from "../../../../shared/infrastructure/database/connection";
import {
  cartItems,
  products,
} from "../../../../shared/infrastructure/database/schema";

// Error types for cart validation
const CartValidationErrors = {
  PRODUCT_NOT_FOUND: (productId?: string) => ({
    key: "PRODUCT_NOT_FOUND",
    message: productId ? `Product ${productId} not found` : "Product not found",
  }),
  INSUFFICIENT_STOCK: (availableStock: number) => ({
    key: "INSUFFICIENT_STOCK",
    params: { stock: availableStock },
    message: `Only ${availableStock} items available in stock`,
  }),
  INSUFFICIENT_STOCK_ALREADY_IN_CART: (
    availableStock: number,
    inCart: number
  ) => ({
    key: "INSUFFICIENT_STOCK_ALREADY_IN_CART",
    params: {
      stock: availableStock,
      inCart: inCart,
      canAdd: availableStock - inCart,
    },
    message: `You already have ${inCart} in cart. Only ${availableStock - inCart} more available`,
  }),
  CART_ITEM_NOT_FOUND: () => ({
    key: "CART_ITEM_NOT_FOUND",
    message: "Cart item not found or unauthorized",
  }),
} as const;

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
      throw new Error(JSON.stringify(CartValidationErrors.PRODUCT_NOT_FOUND(productId)));
    }

    const productData = product[0];
    const availableStock = productData.stock || 0;
    if (availableStock < requestedQuantity) {
      throw new Error(
        JSON.stringify(CartValidationErrors.INSUFFICIENT_STOCK(availableStock))
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
      throw new Error(JSON.stringify(CartValidationErrors.PRODUCT_NOT_FOUND(productId)));
    }

    const productData = product[0];
    const availableStock = productData.stock || 0;

    if (newTotalQuantity > availableStock) {
      const error = oldCartQuantity > 0
        ? CartValidationErrors.INSUFFICIENT_STOCK_ALREADY_IN_CART(
            availableStock,
            oldCartQuantity
          )
        : CartValidationErrors.INSUFFICIENT_STOCK(availableStock);

      console.log("🔴 [CartValidationService] Stock validation failed:", {
        productId,
        availableStock,
        newTotalQuantity,
        oldCartQuantity,
        error,
      });

      throw new Error(JSON.stringify(error));
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
   * Kullanıcı tipine göre minimum miktar kontrolü yapar
   */
  static async validateMinQuantity(
    productId: string,
    quantity: number,
    userType: "individual" | "corporate"
  ) {
    const product = await db
      .select({
        id: products.id,
        minQuantityIndividual: products.minQuantityIndividual,
        minQuantityCorporate: products.minQuantityCorporate,
      })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product.length) {
      throw new Error(JSON.stringify(CartValidationErrors.PRODUCT_NOT_FOUND(productId)));
    }

    const productData = product[0];
    const minQuantity = userType === "corporate"
      ? (productData.minQuantityCorporate ?? 1)
      : (productData.minQuantityIndividual ?? 1);

    if (quantity < minQuantity) {
      throw new Error(
        JSON.stringify({
          key: "MIN_QUANTITY_NOT_MET",
          params: { minQuantity, userType },
          message: `Minimum ${minQuantity} adet alım zorunludur`,
        })
      );
    }

    return productData;
  }

  /**
   * Stok kontrolü yapar (mevcut sepet öğesi için)
   */
}

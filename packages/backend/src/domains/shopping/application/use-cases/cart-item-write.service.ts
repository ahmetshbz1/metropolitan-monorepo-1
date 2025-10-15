//  "cart-item-write.service.ts"
//  metropolitan backend
//  Created by Ahmet on 26.06.2025.

import type {
  AddToCartRequest,
  CartOperationResponse,
} from "@metropolitan/shared/types/cart";
import { and, eq } from "drizzle-orm";

import { db } from "../../../../shared/infrastructure/database/connection";
import { cartItems } from "../../../../shared/infrastructure/database/schema";
import { logger } from "../../../../shared/infrastructure/monitoring/logger.config";

import { CartCalculationService } from "./cart-calculation.service";
import { CartItemQueryService } from "./cart-item-query.service";
import { CartValidationService } from "./cart-validation.service";

/**
 * Sepet yazma işlemlerini yöneten servis (ekleme, güncelleme, silme)
 */
export class CartItemWriteService {
  /**
   * Sepete ürün ekler
   */
  static async addItemToCart(
    userId: string,
    request: AddToCartRequest,
    userType: "individual" | "corporate"
  ): Promise<CartOperationResponse> {
    const { productId, quantity = 1 } = request;

    // Minimum quantity kontrolü
    await CartValidationService.validateMinQuantity(productId, quantity, userType);

    // Mevcut sepet öğesi var mı kontrol et
    const existingItem = await CartValidationService.getExistingCartItem(
      userId,
      productId
    );

    if (existingItem) {
      // Mevcut öğeyi güncelle
      const newQuantity = existingItem.quantity + quantity;
      logger.info(
        {
          productId,
          existingQuantity: existingItem.quantity,
          addingQuantity: quantity,
          newQuantity,
          userType,
        },
        "CartItemService: Adding to existing cart item"
      );

      await CartValidationService.validateMinQuantity(productId, newQuantity, userType);
      await CartValidationService.validateStock(
        productId,
        newQuantity,
        existingItem.quantity
      );

      await db
        .update(cartItems)
        .set({
          quantity: newQuantity,
          updatedAt: new Date(),
        })
        .where(eq(cartItems.id, existingItem.id));

      const updatedCartItems = await CartItemQueryService.getUserCartItems(userId, userType);
      const summary = CartCalculationService.generateCartSummary(
        updatedCartItems.items
      );
      return {
        message: "Sepet güncellendi",
        itemId: existingItem.id,
        cartSummary: summary,
      };
    } else {
      // Yeni öğe ekliyorsak, basit stok kontrolü yeterli
      await CartValidationService.validateStock(productId, quantity, 0);

      // Yeni öğe ekle
      const newItems = await db
        .insert(cartItems)
        .values({
          userId,
          productId,
          quantity,
        })
        .returning();

      const newItem = newItems[0];
      if (!newItem) throw new Error("Sepet öğesi oluşturulamadı");

      const updatedCartItems = await CartItemQueryService.getUserCartItems(userId, userType);
      const summary = CartCalculationService.generateCartSummary(
        updatedCartItems.items
      );
      return {
        message: "Ürün sepete eklendi",
        itemId: newItem.id,
        cartSummary: summary,
      };
    }
  }

  /**
   * Sepet öğesini günceller
   */
  static async updateCartItem(
    userId: string,
    itemId: string,
    quantity: number,
    userType: "individual" | "corporate"
  ): Promise<{ message: string }> {
    // Sepet öğesinin kullanıcıya ait olduğunu kontrol et
    await CartValidationService.validateCartOwnership(itemId, userId);

    const cartItem = await db.query.cartItems.findFirst({
      where: eq(cartItems.id, itemId),
    });

    if (!cartItem) throw new Error("Sepet öğesi bulunamadı");

    // Minimum quantity kontrolü
    await CartValidationService.validateMinQuantity(cartItem.productId, quantity, userType);

    // Stok kontrolü
    await CartValidationService.validateStock(
      cartItem.productId,
      quantity,
      cartItem.quantity
    );

    await db
      .update(cartItems)
      .set({
        quantity,
        updatedAt: new Date(),
      })
      .where(eq(cartItems.id, itemId));

    return { message: "Sepet öğesi güncellendi" };
  }

  /**
   * Sepet öğesini siler
   */
  static async removeCartItem(
    userId: string,
    itemId: string
  ): Promise<{ message: string }> {
    const result = await db
      .delete(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.userId, userId)))
      .returning();

    if (!result.length) {
      throw new Error("Sepet öğesi bulunamadı");
    }

    return { message: "Ürün sepetten kaldırıldı" };
  }

  /**
   * Kullanıcının tüm sepetini temizler
   */
  static async clearCart(userId: string): Promise<{ message: string }> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));

    return { message: "Sepet temizlendi" };
  }
}

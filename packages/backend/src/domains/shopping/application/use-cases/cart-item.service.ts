//  "cart-item.service.ts"
//  metropolitan backend
//  Created by Ahmet on 26.06.2025.

import type {
  AddToCartRequest,
  CartItem,
  CartOperationResponse,
  CartSummary,
} from "@metropolitan/shared/types/cart";
import { and, desc, eq } from "drizzle-orm";

import { db } from "../../../../shared/infrastructure/database/connection";
import {
  cartItems,
  productTranslations,
  products,
} from "../../../../shared/infrastructure/database/schema";

import { CartCalculationService } from "./cart-calculation.service";
import { CartValidationService } from "./cart-validation.service";

// Bu tip backend'e özel kalabilir
interface CartResponse {
  items: CartItem[];
  summary: CartSummary;
}

export class CartItemService {
  /**
   * Kullanıcının sepet öğelerini getirir
   */
  static async getUserCartItems(userId: string): Promise<CartResponse> {
    const userCartItems = await db
      .select({
        id: cartItems.id,
        quantity: cartItems.quantity,
        createdAt: cartItems.createdAt,
        product: {
          id: products.id,
          productCode: products.productCode,
          brand: products.brand,
          size: products.size,
          image: products.imageUrl,
          price: products.price,
          currency: products.currency,
          stock: products.stock,
          name: productTranslations.name,
          category: products.categoryId,
        },
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .leftJoin(
        productTranslations,
        and(
          eq(productTranslations.productId, products.id),
          eq(productTranslations.languageCode, "tr")
        )
      )
      .where(eq(cartItems.userId, userId))
      .orderBy(desc(cartItems.createdAt));

    const summary = CartCalculationService.generateCartSummary(
      userCartItems.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        product: {
          ...item.product,
          price: Number(item.product.price),
          image: item.product.image || "",
          category: item.product.category || "",
          brand: item.product.brand || "",
          name: item.product.name || "",
          stock: item.product.stock || 0,
          size: item.product.size || undefined,
        },
      }))
    );

    return {
      items: userCartItems.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        product: {
          ...item.product,
          price: Number(item.product.price),
          image: item.product.image || "",
          category: item.product.category || "",
          brand: item.product.brand || "",
          name: item.product.name || "",
          stock: item.product.stock || 0,
          size: item.product.size || undefined,
        },
      })),
      summary,
    };
  }

  /**
   * Sepete ürün ekler
   */
  static async addItemToCart(
    userId: string,
    request: AddToCartRequest
  ): Promise<CartOperationResponse> {
    const { productId, quantity = 1 } = request;

    // Mevcut sepet öğesi var mı kontrol et
    const existingItem = await CartValidationService.getExistingCartItem(
      userId,
      productId
    );

    if (existingItem) {
      // Mevcut öğeyi güncelle
      const newQuantity = existingItem.quantity + quantity;
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

      const updatedCartItems = await this.getUserCartItems(userId);
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

      const updatedCartItems = await this.getUserCartItems(userId);
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
    quantity: number
  ): Promise<{ message: string }> {
    // Sepet öğesinin kullanıcıya ait olduğunu kontrol et
    await CartValidationService.validateCartOwnership(itemId, userId);

    const cartItem = await db.query.cartItems.findFirst({
      where: eq(cartItems.id, itemId),
    });

    if (!cartItem) throw new Error("Sepet öğesi bulunamadı");

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

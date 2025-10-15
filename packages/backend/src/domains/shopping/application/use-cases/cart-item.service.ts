//  "cart-item.service.ts"
//  metropolitan backend
//  Created by Ahmet on 26.06.2025.

import type {
  AddToCartRequest,
  CartOperationResponse,
} from "@metropolitan/shared/types/cart";

import { CartItemBatchService } from "./cart-item-batch.service";
import { CartItemQueryService } from "./cart-item-query.service";
import { CartItemWriteService } from "./cart-item-write.service";
import type { CartResponse } from "./cart-item-types";

/**
 * Ana sepet servisi - tüm sepet işlemlerini koordine eder
 * Geriye dönük uyumluluk için tüm metotları tek bir arayüzde toplar
 */
export class CartItemService {
  /**
   * Kullanıcının sepet öğelerini getirir
   */
  static async getUserCartItems(
    userId: string,
    userType?: "individual" | "corporate"
  ): Promise<CartResponse> {
    return CartItemQueryService.getUserCartItems(userId, userType);
  }

  /**
   * Sepete ürün ekler
   */
  static async addItemToCart(
    userId: string,
    request: AddToCartRequest,
    userType: "individual" | "corporate"
  ): Promise<CartOperationResponse> {
    return CartItemWriteService.addItemToCart(userId, request, userType);
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
    return CartItemWriteService.updateCartItem(userId, itemId, quantity, userType);
  }

  /**
   * Sepet öğesini siler
   */
  static async removeCartItem(
    userId: string,
    itemId: string
  ): Promise<{ message: string }> {
    return CartItemWriteService.removeCartItem(userId, itemId);
  }

  /**
   * Kullanıcının tüm sepetini temizler
   */
  static async clearCart(userId: string): Promise<{ message: string }> {
    return CartItemWriteService.clearCart(userId);
  }

  /**
   * Sepet öğelerini toplu günceller (batch update)
   */
  static async batchUpdateCartItems(
    userId: string,
    updates: Array<{ itemId: string; quantity: number }>,
    userType: "individual" | "corporate"
  ): Promise<{
    message: string;
    updatedCount: number;
    adjustedItems?: Array<{ itemId: string; requestedQty: number; adjustedQty: number; productName: string }>;
  }> {
    return CartItemBatchService.batchUpdateCartItems(userId, updates, userType);
  }
}

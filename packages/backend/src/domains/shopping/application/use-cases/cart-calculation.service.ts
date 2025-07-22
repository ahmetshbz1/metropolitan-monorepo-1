//  "cart-calculation.service.ts"
//  metropolitan backend
//  Created by Ahmet on 17.06.2025.

import type {
  CartItem as CartItemWithProduct,
  CartSummary,
} from "@metropolitan/shared/types/cart";

export class CartCalculationService {
  /**
   * Sepet toplam tutarını hesaplar
   */
  static calculateCartTotal(cartItems: CartItemWithProduct[]): number {
    return cartItems.reduce((sum, item) => {
      const price = item.product.price || 0;
      return sum + price * item.quantity;
    }, 0);
  }

  /**
   * Sepet toplam öğe sayısını hesaplar
   */
  static calculateTotalItems(cartItems: CartItemWithProduct[]): number {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Sepet özetini oluşturur
   */
  static generateCartSummary(cartItems: CartItemWithProduct[]): CartSummary {
    const totalAmount = this.calculateCartTotal(cartItems);
    const totalItems = this.calculateTotalItems(cartItems);

    return {
      totalItems,
      totalAmount: totalAmount.toFixed(2),
      currency: "PLN",
    };
  }

  /**
   * Tek bir öğenin toplam fiyatını hesaplar
   */
  static calculateItemTotal(price: number | null, quantity: number): number {
    const unitPrice = price || 0;
    return unitPrice * quantity;
  }
}

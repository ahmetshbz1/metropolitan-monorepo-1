//  "order-calculation.service.ts"
//  metropolitan backend
//  Created by Ahmet on 11.07.2025.

import type { CartItem as CartItemData } from "@metropolitan/shared/types/cart";
import type { OrderItem as OrderItemData } from "@metropolitan/shared/types/order";

export class OrderCalculationService {
  /**
   * Sepet öğelerinden sipariş öğelerini hazırlar ve toplam tutarı hesaplar
   */
  static prepareOrderItems(cartItems: CartItemData[]): {
    orderItems: OrderItemData[];
    totalAmount: number;
  } {
    let totalAmount = 0;
    const orderItems: OrderItemData[] = [];

    for (const item of cartItems) {
      const unitPrice = item.product?.price || 0;
      const totalPrice = unitPrice * item.quantity;
      totalAmount += totalPrice;

      orderItems.push({
        id: "", // Bu alan veritabanında otomatik oluşacak
        product: item.product,
        quantity: item.quantity,
        unitPrice: unitPrice.toString(),
        totalPrice: totalPrice.toString(),
      });
    }

    return {
      orderItems,
      totalAmount,
    };
  }

  /**
   * Toplam tutarı hesaplar
   */
  static calculateTotalAmount(cartItems: CartItemData[]): number {
    return cartItems.reduce((sum, item) => {
      const price = item.product?.price || 0;
      return sum + price * item.quantity;
    }, 0);
  }
}

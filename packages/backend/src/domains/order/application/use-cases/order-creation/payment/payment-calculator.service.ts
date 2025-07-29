//  "payment-calculator.service.ts"
//  metropolitan backend
//  Service for payment amount calculations

import type { CartItem as CartItemData } from "@metropolitan/shared/types/cart";

export class PaymentCalculatorService {
  /**
   * Calculate total amount from cart items (in cents)
   */
  static calculateAmountFromCart(cartItems: CartItemData[]): number {
    const totalAmount = cartItems.reduce((sum, item) => {
      const price = item.product?.price || 0;
      return sum + price * item.quantity;
    }, 0);

    // PLN to cents conversion (multiply by 100) - Polish Zloty
    return Math.round(totalAmount * 100);
  }
  
  /**
   * Calculate total amount in base currency
   */
  static calculateTotalInBaseCurrency(cartItems: CartItemData[]): number {
    return cartItems.reduce((sum, item) => {
      const price = item.product?.price || 0;
      return sum + price * item.quantity;
    }, 0);
  }
}
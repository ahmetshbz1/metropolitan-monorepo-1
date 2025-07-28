//  "payment-processing.service.ts"
//  metropolitan backend
//  Payment processing logic extracted from OrderCreationService

import type {
  OrderCreationRequest,
  OrderCreationResult,
  OrderItem as OrderItemData,
} from "@metropolitan/shared/types/order";
import type { CartItem as CartItemData } from "@metropolitan/shared/types/cart";
import { eq } from "drizzle-orm";
import StripeService from "../../../../../shared/infrastructure/external/stripe.service";

export class PaymentProcessingService {
  /**
   * Sepet öğelerinden toplam tutarı hesaplar (cent cinsinden)
   */
  static calculateAmountFromCart(cartItems: CartItemData[]): number {
    const totalAmount = cartItems.reduce((sum, item) => {
      const price = item.product?.price || 0;
      return sum + price * item.quantity;
    }, 0);

    // PLN'den cent'e çevir (100 ile çarp) - Polonya Zloty
    return Math.round(totalAmount * 100);
  }

  /**
   * Stripe için metadata oluşturur
   */
  static createOrderMetadata(
    orderId: string,
    userId: string
  ): Record<string, string> {
    return {
      order_id: orderId,
      user_id: userId,
      source: "metropolitan_app",
    };
  }

  /**
   * Determines if payment method is Stripe-based
   */
  static isStripePayment(paymentMethodId: string): boolean {
    const stripePaymentTypes = [
      "card",
      "bank_transfer",
      "blik",
      "apple_pay",
      "google_pay",
    ];
    return stripePaymentTypes.includes(paymentMethodId);
  }

  /**
   * Creates order payload for database insertion
   */
  static createOrderPayload(
    userId: string,
    request: OrderCreationRequest,
    totalAmount: number,
    isStripePayment: boolean
  ): any {
    const { generateOrderNumber } = require("../../../domain/value-objects/order-number.util");
    
    const orderPayload: any = {
      orderNumber: generateOrderNumber(),
      userId: userId,
      shippingAddressId: request.shippingAddressId,
      totalAmount: totalAmount.toString(),
      status: "pending",
      paymentStatus: "pending",
    };

    // Payment method handling
    if (isStripePayment) {
      orderPayload.paymentMethodType = request.paymentMethodId;
      orderPayload.paymentMethodId = null;
    } else {
      orderPayload.paymentMethodId = request.paymentMethodId;
      orderPayload.paymentMethodType = null;
    }

    // Billing address defaults to shipping if not provided
    orderPayload.billingAddressId =
      request.billingAddressId || request.shippingAddressId;
    
    if (request.notes) {
      orderPayload.notes = request.notes;
    }

    return orderPayload;
  }

  /**
   * Handles corporate bank transfer auto-approval
   */
  static async handleCorporateBankTransfer(
    tx: any,
    order: any,
    orderItemsData: OrderItemData[],
    cartItemsData: CartItemData[],
    userId: string
  ): Promise<OrderCreationResult> {
    const { orders, orderItems } = await import("../../../../../shared/infrastructure/database/schema");
    const { CartManagementService } = await import("./cart-management.service");
    
    console.log("🏢 Kurumsal müşteri banka havalesi - otomatik onay");

    // Auto-approve order
    await tx
      .update(orders)
      .set({
        status: "confirmed",
        paymentStatus: "pending",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    // Create order items
    for (const itemData of orderItemsData) {
      await tx.insert(orderItems).values({
        orderId: order.id,
        productId: itemData.product.id,
        quantity: itemData.quantity,
        unitPrice: itemData.unitPrice,
        totalPrice: itemData.totalPrice,
      });
    }

    // Clear cart
    if (cartItemsData.length > 0) {
      await CartManagementService.clearUserCart(tx, userId);
    }

    // Generate invoice in background
    this.createInvoiceInBackground(order.id, userId);

    return {
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: "confirmed",
        totalAmount: order.totalAmount,
        currency: order.currency,
        createdAt: order.createdAt,
        paymentStatus: "pending",
      },
    };
  }

  /**
   * Processes Stripe payment and creates payment intent
   */
  static async processStripePayment(
    order: any,
    request: OrderCreationRequest,
    cartItemsData: CartItemData[],
    userId: string
  ): Promise<{ paymentIntentId: string; clientSecret: string }> {
    const amountInCents = this.calculateAmountFromCart(cartItemsData);

    // Stripe payment intent oluştur
    const paymentIntentParams: any = {
      amount: amountInCents,
      currency: "pln", // Satışlar PLN cinsinden!
      metadata: this.createOrderMetadata(order.id, userId),
    };

    // Belirli payment method'ları için stripe configuration
    console.log("🔧 Payment method ID:", request.paymentMethodId);
    if (request.paymentMethodId === "card") {
      paymentIntentParams.paymentMethodTypes = ["card"];
      console.log("💳 Using card payment methods only");
    } else if (request.paymentMethodId === "blik") {
      paymentIntentParams.paymentMethodTypes = ["blik"];
      // BLIK Poland'a özel, currency PLN olmalı
      if (paymentIntentParams.currency !== "pln") {
        console.warn("⚠️ BLIK requires PLN currency, forcing to pln");
        paymentIntentParams.currency = "pln";
      }
      console.log("📱 Using BLIK payment methods only");
    } else {
      console.log("🔄 Using automatic payment methods");
    }

    const paymentIntent = await StripeService.createPaymentIntent(paymentIntentParams);

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
    };
  }

  /**
   * Updates order with Stripe payment information
   */
  static async updateOrderWithStripeInfo(
    tx: any,
    orderId: string,
    paymentIntentId: string,
    clientSecret: string
  ): Promise<void> {
    const { orders } = await import("../../../../../shared/infrastructure/database/schema");
    
    await tx
      .update(orders)
      .set({
        stripePaymentIntentId: paymentIntentId,
        stripeClientSecret: clientSecret,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
  }

  /**
   * Background'da fatura oluşturur ve cache'e atar
   */
  private static createInvoiceInBackground(
    orderId: string,
    userId: string
  ): void {
    // Async olarak çalıştır, sipariş oluşturmayı beklemesin
    setImmediate(async () => {
      try {
        console.log(`Background fatura oluşturuluyor: ${orderId}`);
        const startTime = performance.now();

        // Faturayı oluştur ve cache'e at
        const { InvoiceService } = await import("../invoice.service");
        await InvoiceService.generateInvoicePDF(orderId, userId);

        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);
        console.log(
          `Background fatura oluşturuldu: ${orderId} (${duration}ms)`
        );
      } catch (error) {
        // Fatura oluşturulamazsa log at ama sipariş etkilenmesin
        console.error(`Background fatura oluşturma hatası: ${orderId}`, error);
      }
    });
  }
}
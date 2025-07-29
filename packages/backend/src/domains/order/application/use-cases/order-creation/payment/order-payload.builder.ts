//  "order-payload.builder.ts"
//  metropolitan backend
//  Builder for order creation payload

import type { OrderCreationRequest } from "@metropolitan/shared/types/order";

export class OrderPayloadBuilder {
  /**
   * Create order payload for database insertion
   */
  static build(
    userId: string,
    request: OrderCreationRequest,
    totalAmount: number,
    isStripePayment: boolean
  ): any {
    const { generateOrderNumber } = require("../../../../domain/value-objects/order-number.util");
    
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
}
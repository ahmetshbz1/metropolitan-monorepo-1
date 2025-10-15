//  "stripe.service.ts"
//  metropolitan backend
//  Created by Ahmet on 11.01.2025.

import Stripe from "stripe";

import { logger } from "../monitoring/logger.config";

class StripeService {
  private stripe: Stripe;

  constructor() {
    const isProduction = process.env.NODE_ENV === "production";
    const secretKey = isProduction
      ? process.env.STRIPE_SECRET_KEY_LIVE
      : process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      throw new Error(
        `Stripe secret key is missing. Expected ${
          isProduction ? "STRIPE_SECRET_KEY_LIVE" : "STRIPE_SECRET_KEY"
        } in environment variables.`
      );
    }

    this.stripe = new Stripe(secretKey);
  }

  async createPaymentIntent({
    amount,
    currency = "pln",
    metadata = {},
    automaticPaymentMethods = { enabled: true },
    paymentMethodTypes,
  }: {
    amount: number;
    currency?: string;
    metadata?: Record<string, string>;
    automaticPaymentMethods?: { enabled: boolean };
    paymentMethodTypes?: string[];
  }): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntentConfig: Stripe.PaymentIntentCreateParams = {
        amount,
        currency,
        metadata,
      };

      // Belirli payment method tipleri belirtildiyse onları kullan
      if (paymentMethodTypes && paymentMethodTypes.length > 0) {
        paymentIntentConfig.payment_method_types = paymentMethodTypes;
      } else {
        // Otomatik payment method'ları kullan
        paymentIntentConfig.automatic_payment_methods = automaticPaymentMethods;
      }

      const paymentIntent = await this.stripe.paymentIntents.create(
        paymentIntentConfig
      );

      return paymentIntent;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : "Unknown error" }, "Stripe PaymentIntent creation error");
      throw new Error("Payment intent creation failed");
    }
  }

  async createCheckoutSession({
    amount,
    currency = "pln",
    orderId,
    userId,
    successUrl,
    cancelUrl,
    paymentMethodTypes = ["card"],
  }: {
    amount: number;
    currency?: string;
    orderId: string;
    userId: string;
    successUrl: string;
    cancelUrl: string;
    paymentMethodTypes?: string[];
  }): Promise<Stripe.Checkout.Session> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: paymentMethodTypes,
        line_items: [
          {
            price_data: {
              currency,
              product_data: {
                name: `Sipariş #${orderId.slice(0, 8)}`,
                description: "Metropolitan Food Group",
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          order_id: orderId,
          user_id: userId,
          source: "metropolitan_web",
        },
      });

      logger.info(
        {
          sessionId: session.id,
          paymentMethods: paymentMethodTypes.join(", "),
        },
        "Stripe Checkout Session created"
      );
      return session;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : "Unknown error" }, "Stripe Checkout Session creation error");
      throw new Error("Checkout session creation failed");
    }
  }

  async getPaymentIntent(
    paymentIntentId: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        paymentIntentId
      );
      return paymentIntent;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : "Unknown error" }, "Stripe PaymentIntent retrieval error");
      throw new Error("Payment intent retrieval failed");
    }
  }

  async updatePaymentIntent(
    paymentIntentId: string,
    data: Stripe.PaymentIntentUpdateParams
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.update(
        paymentIntentId,
        data
      );
      return paymentIntent;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : "Unknown error" }, "Stripe PaymentIntent update error");
      throw new Error("Payment intent update failed");
    }
  }

  async cancelPaymentIntent(
    paymentIntentId: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.cancel(
        paymentIntentId
      );
      return paymentIntent;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : "Unknown error" }, "Stripe PaymentIntent cancellation error");
      throw new Error("Payment intent cancellation failed");
    }
  }

  async createRefund({
    paymentIntentId,
    amount,
    reason,
  }: {
    paymentIntentId: string;
    amount?: number;
    reason?: Stripe.RefundCreateParams.Reason;
  }): Promise<Stripe.Refund> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount,
        reason,
      });

      return refund;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : "Unknown error" }, "Stripe Refund creation error");
      throw new Error("Refund creation failed");
    }
  }

  async getRefund(refundId: string): Promise<Stripe.Refund> {
    try {
      const refund = await this.stripe.refunds.retrieve(refundId);
      return refund;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : "Unknown error" }, "Stripe Refund retrieval error");
      throw new Error("Refund retrieval failed");
    }
  }

  async listRefunds(
    paymentIntentId?: string,
    limit: number = 10
  ): Promise<Stripe.ApiList<Stripe.Refund>> {
    try {
      const refunds = await this.stripe.refunds.list({
        payment_intent: paymentIntentId,
        limit,
      });

      return refunds;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : "Unknown error" }, "Stripe Refund listing error");
      throw new Error("Refund listing failed");
    }
  }

  // Webhook olaylarını doğrulamak için
  async constructWebhookEvent(
    payload: string,
    signature: string
  ): Promise<Stripe.Event> {
    try {
      const event = await this.stripe.webhooks.constructEventAsync(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
      return event;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : "Unknown error" }, "Stripe webhook signature verification failed");
      throw new Error("Webhook signature verification failed");
    }
  }

  // Customer işlemleri
  async createCustomer({
    email,
    name,
    metadata = {},
  }: {
    email: string;
    name?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata,
      });

      return customer;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : "Unknown error" }, "Stripe Customer creation error");
      throw new Error("Customer creation failed");
    }
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      return customer as Stripe.Customer;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : "Unknown error" }, "Stripe Customer retrieval error");
      throw new Error("Customer retrieval failed");
    }
  }

  async updateCustomer(
    customerId: string,
    data: Stripe.CustomerUpdateParams
  ): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.update(customerId, data);
      return customer;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : "Unknown error" }, "Stripe Customer update error");
      throw new Error("Customer update failed");
    }
  }

  async deleteCustomer(customerId: string): Promise<Stripe.DeletedCustomer> {
    try {
      const deletedCustomer = await this.stripe.customers.del(customerId);
      return deletedCustomer;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : "Unknown error" }, "Stripe Customer deletion error");
      throw new Error("Customer deletion failed");
    }
  }
}

export default new StripeService();

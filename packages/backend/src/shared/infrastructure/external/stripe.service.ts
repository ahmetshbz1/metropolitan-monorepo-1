//  "stripe.service.ts"
//  metropolitan backend
//  Created by Ahmet on 11.01.2025.

import Stripe from "stripe";

class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
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

      const paymentIntent =
        await this.stripe.paymentIntents.create(paymentIntentConfig);

      return paymentIntent;
    } catch (error) {
      console.error("Stripe PaymentIntent creation error:", error);
      throw new Error("Payment intent creation failed");
    }
  }

  async getPaymentIntent(
    paymentIntentId: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent =
        await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      console.error("Stripe PaymentIntent retrieval error:", error);
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
      console.error("Stripe PaymentIntent update error:", error);
      throw new Error("Payment intent update failed");
    }
  }

  async cancelPaymentIntent(
    paymentIntentId: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent =
        await this.stripe.paymentIntents.cancel(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      console.error("Stripe PaymentIntent cancellation error:", error);
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
      console.error("Stripe Refund creation error:", error);
      throw new Error("Refund creation failed");
    }
  }

  async getRefund(refundId: string): Promise<Stripe.Refund> {
    try {
      const refund = await this.stripe.refunds.retrieve(refundId);
      return refund;
    } catch (error) {
      console.error("Stripe Refund retrieval error:", error);
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
      console.error("Stripe Refund listing error:", error);
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
      console.error("Stripe webhook signature verification failed:", error);
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
      console.error("Stripe Customer creation error:", error);
      throw new Error("Customer creation failed");
    }
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      return customer as Stripe.Customer;
    } catch (error) {
      console.error("Stripe Customer retrieval error:", error);
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
      console.error("Stripe Customer update error:", error);
      throw new Error("Customer update failed");
    }
  }

  async deleteCustomer(customerId: string): Promise<Stripe.DeletedCustomer> {
    try {
      const deletedCustomer = await this.stripe.customers.del(customerId);
      return deletedCustomer;
    } catch (error) {
      console.error("Stripe Customer deletion error:", error);
      throw new Error("Customer deletion failed");
    }
  }
}

export default new StripeService();

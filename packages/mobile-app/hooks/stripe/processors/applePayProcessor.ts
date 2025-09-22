//  "applePayProcessor.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import { PlatformPay } from "@stripe/stripe-react-native";
import { PlatformPayParams, StripePaymentResult } from '../types';
import { api } from '@/core/api';

export const processApplePayPayment = async ({
  clientSecret,
  confirmPlatformPayPayment,
  t,
  amount,
  currency = "PLN",
  orderId // Add orderId parameter
}: PlatformPayParams & { orderId?: string }): Promise<StripePaymentResult> => {
  console.log("🍎 Processing Apple Pay payment...");
  console.log("💰 Amount:", amount, currency);
  console.log("📦 Order ID:", orderId);

  const { error } = await confirmPlatformPayPayment(clientSecret, {
    applePay: {
      cartItems: [
        {
          label: "Metropolitan Food",
          amount: amount || "0.00",
          paymentType: PlatformPay.PaymentType.Immediate,
        },
      ],
      merchantCountryCode: "PL",
      currencyCode: currency,
    },
  });

  if (error) {
    console.error("❌ Apple Pay error:", error);

    // CRITICAL: Rollback stock if payment was cancelled/failed
    if (orderId && (error.code === 'Canceled' || error.code === 'Failed')) {
      console.log(`🔄 Apple Pay ${error.code.toLowerCase()}, attempting stock rollback for order ${orderId}`);

      try {
        const rollbackResponse = await api.post(`/orders/${orderId}/rollback-stock`);
        console.log(`✅ Stock rollback successful:`, rollbackResponse.data);
      } catch (rollbackError: any) {
        console.error(`❌ Stock rollback failed for order ${orderId}:`, rollbackError);
        // Don't fail the payment error response due to rollback failure
        // Just log it for monitoring
      }
    }

    return {
      success: false,
      error: error.message || t("payment.apple_pay_error"),
    };
  }

  console.log("✅ Apple Pay payment completed successfully!");
  const paymentIntentId = clientSecret.split("_secret_")[0];
  return {
    success: true,
    clientSecret,
    paymentIntentId,
  };
};

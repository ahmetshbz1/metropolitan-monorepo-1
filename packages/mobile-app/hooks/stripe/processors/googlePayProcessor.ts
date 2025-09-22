//  "googlePayProcessor.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import { PlatformPayParams, StripePaymentResult } from '../types';
import { api } from '@/core/api';

export const processGooglePayPayment = async ({
  clientSecret,
  confirmPlatformPayPayment,
  t,
  amount,
  currency = "PLN",
  orderId // Add orderId parameter
}: PlatformPayParams & { orderId?: string }): Promise<StripePaymentResult> => {
  console.log("🟢 Processing Google Pay payment...");
  console.log("📦 Order ID:", orderId);

  const { error } = await confirmPlatformPayPayment(clientSecret, {
    googlePay: {
      merchantCountryCode: "PL",
      currencyCode: "PLN",
      testEnv: __DEV__, // Development modunda test environment kullan
    },
  });

  if (error) {
    console.error("❌ Google Pay error:", error);

    // CRITICAL: Rollback stock if payment was cancelled/failed
    if (orderId && (error.code === 'Canceled' || error.code === 'Failed')) {
      console.log(`🔄 Google Pay ${error.code.toLowerCase()}, attempting stock rollback for order ${orderId}`);

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
      error: error.message || t("payment.google_pay_error"),
    };
  }

  console.log("✅ Google Pay payment completed successfully!");
  const paymentIntentId = clientSecret.split("_secret_")[0];
  return {
    success: true,
    clientSecret,
    paymentIntentId,
  };
};

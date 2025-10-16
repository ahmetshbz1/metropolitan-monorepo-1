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
  // Removed console statement
  // Removed console statement

  const { error } = await confirmPlatformPayPayment(clientSecret, {
    googlePay: {
      merchantCountryCode: "PL",
      currencyCode: currency,
      testEnv: false, // Production environment - Google Pay merchant onaylı
      merchantName: "Metropolitan Food Group",
    },
  });

  if (error) {
    // Removed console statement

    // CRITICAL: Rollback stock if payment was cancelled/failed
    if (orderId && (error.code === 'Canceled' || error.code === 'Failed')) {
      // Removed console statement}, attempting stock rollback for order ${orderId}`);

      try {
        const rollbackResponse = await api.post(`/orders/${orderId}/rollback-stock`);
        // Removed console statement
      } catch (rollbackError: any) {
        // Removed console statement
        // Don't fail the payment error response due to rollback failure
        // Just log it for monitoring
      }
    }

    // Use general localized error messages instead of hardcoded English from Stripe
    let errorMessage: string;
    if (error.code === 'Canceled') {
      errorMessage = t("payment.canceled");
    } else {
      errorMessage = t("payment.google_pay_error");
    }

    return {
      success: false,
      error: errorMessage,
    };
  }

  // Removed console statement
  const paymentIntentId = clientSecret.split("_secret_")[0];
  return {
    success: true,
    clientSecret,
    paymentIntentId,
  };
};

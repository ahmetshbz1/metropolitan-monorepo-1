//  "googlePayProcessor.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import { PlatformPayParams, StripePaymentResult } from '../types';

export const processGooglePayPayment = async ({
  clientSecret,
  confirmPlatformPayPayment,
  t
}: PlatformPayParams): Promise<StripePaymentResult> => {
  console.log("🟢 Processing Google Pay payment...");

  const { error } = await confirmPlatformPayPayment(clientSecret, {
    googlePay: {
      merchantCountryCode: "PL",
      currencyCode: "PLN",
      testEnv: __DEV__, // Development modunda test environment kullan
    },
  });

  if (error) {
    console.error("❌ Google Pay error:", error);
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

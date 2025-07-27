//  "applePayProcessor.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import { PlatformPay } from "@stripe/stripe-react-native";
import { PlatformPayParams, StripePaymentResult } from '../types';

export const processApplePayPayment = async ({
  clientSecret,
  confirmPlatformPayPayment,
  t
}: PlatformPayParams): Promise<StripePaymentResult> => {
  console.log("🍎 Processing Apple Pay payment...");

  const { error } = await confirmPlatformPayPayment(clientSecret, {
    applePay: {
      cartItems: [
        {
          label: "Metropolitan Food",
          amount: "0.00", // Backend'den glebe gerçek tutar
          paymentType: PlatformPay.PaymentType.Immediate,
        },
      ],
      merchantCountryCode: "PL",
      currencyCode: "PLN",
    },
  });

  if (error) {
    console.error("❌ Apple Pay error:", error);
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

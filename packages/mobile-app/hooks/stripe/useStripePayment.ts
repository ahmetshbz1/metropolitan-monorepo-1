//  "useStripePayment.ts"
//  metropolitan app
//  Created by Ahmet on 16.01.2025.

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useStripe } from "@stripe/stripe-react-native";
import { processApplePayPayment } from './processors/applePayProcessor';
import { processGooglePayPayment } from './processors/googlePayProcessor';
import { processCardPayment } from './processors/cardPayProcessor';
import { StripePaymentResult } from './types';

export const useStripePayment = () => {
  const { initPaymentSheet, presentPaymentSheet, confirmPlatformPayPayment } =
    useStripe();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const processPayment = async (
    clientSecret: string,
    paymentMethodType?: string
  ): Promise<StripePaymentResult> => {
    setLoading(true);

    try {
      console.log("🔧 Processing payment with Stripe...");
      console.log("💳 Selected payment method type:", paymentMethodType);

      // Apple Pay işlemi
      if (paymentMethodType === "apple_pay") {
        return await processApplePayPayment({
          clientSecret,
          confirmPlatformPayPayment,
          t
        });
      }

      // Google Pay işlemi
      if (paymentMethodType === "google_pay") {
        return await processGooglePayPayment({
          clientSecret,
          confirmPlatformPayPayment,
          t
        });
      }

      // Kart ve BLIK ödemeleri
      return await processCardPayment({
        clientSecret,
        paymentMethodType,
        initPaymentSheet,
        presentPaymentSheet,
        t
      });
    } catch (error: any) {
      console.error("❌ Stripe payment error:", error);
      return {
        success: false,
        error: error?.message || t("payment.unknown_error"),
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    processPayment,
    loading,
  };
};

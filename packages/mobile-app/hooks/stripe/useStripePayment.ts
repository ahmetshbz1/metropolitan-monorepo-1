//  "useStripePayment.ts"
//  metropolitan app
//  Created by Ahmet on 16.01.2025.

import { useStripeContext } from "@/context/StripeContext";
import { useStripe } from "@stripe/stripe-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { processApplePayPayment } from "./processors/applePayProcessor";
import { processCardPayment } from "./processors/cardPayProcessor";
import { processGooglePayPayment } from "./processors/googlePayProcessor";
import { StripePaymentResult } from "./types";

export const useStripePayment = () => {
  const { initPaymentSheet, presentPaymentSheet, confirmPlatformPayPayment } =
    useStripe();
  const { isReady } = useStripeContext();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const processPayment = async (
    clientSecret: string,
    paymentMethodType?: string,
    amount?: string,
    currency?: string,
    orderId?: string // Add orderId parameter
  ): Promise<StripePaymentResult> => {
    setLoading(true);

    try {
      // Stripe hazır değilse hata döndür
      if (!isReady) {
        return {
          success: false,
          error:
            t("payment.stripe_not_ready") ||
            "Ödeme sistemi hazır değil. Lütfen bekleyin veya sayfayı yenileyin.",
        };
      }

      // Apple Pay işlemi
      if (paymentMethodType === "apple_pay") {
        return await processApplePayPayment({
          clientSecret,
          confirmPlatformPayPayment,
          t,
          amount,
          currency,
          orderId,
        });
      }

      // Google Pay işlemi
      if (paymentMethodType === "google_pay") {
        return await processGooglePayPayment({
          clientSecret,
          confirmPlatformPayPayment,
          t,
          amount,
          currency,
          orderId,
        });
      }

      // Kart ve BLIK ödemeleri
      return await processCardPayment({
        clientSecret,
        paymentMethodType,
        initPaymentSheet,
        presentPaymentSheet,
        t,
        orderId,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t("payment.unknown_error");
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    processPayment,
    loading,
    isStripeReady: isReady,
  };
};

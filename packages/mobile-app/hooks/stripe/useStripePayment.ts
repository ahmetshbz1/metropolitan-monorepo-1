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
    paymentMethodType?: string,
    amount?: string,
    currency?: string,
    orderId?: string // Add orderId parameter
  ): Promise<StripePaymentResult> => {
    setLoading(true);

    try {
      // Removed console statement
      // Removed console statement

      // Apple Pay işlemi
      if (paymentMethodType === "apple_pay") {
        return await processApplePayPayment({
          clientSecret,
          confirmPlatformPayPayment,
          t,
          amount,
          currency,
          orderId
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
          orderId
        });
      }

      // Kart ve BLIK ödemeleri
      return await processCardPayment({
        clientSecret,
        paymentMethodType,
        initPaymentSheet,
        presentPaymentSheet,
        t,
        orderId
      });
    } catch (error: any) {
      // Removed console statement
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

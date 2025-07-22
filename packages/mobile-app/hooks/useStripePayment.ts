//  "useStripePayment.ts"
//  metropolitan app
//  Created by Ahmet on 16.01.2025.

import { PlatformPay, useStripe } from "@stripe/stripe-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export interface StripePaymentResult {
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  requiresAction?: boolean;
  error?: string;
}

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

      // Apple Pay veya Google Pay için ayrı bir flow kullan
      if (paymentMethodType === "apple_pay") {
        console.log("🍎 Processing Apple Pay payment...");

        const { error } = await confirmPlatformPayPayment(clientSecret, {
          applePay: {
            cartItems: [
              {
                label: "Metropolitan Food",
                amount: "0.00", // Backend'den gelecek gerçek tutar
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
      }

      if (paymentMethodType === "google_pay") {
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
      }

      // Kart ve BLIK ödemeleri için Payment Sheet kullan
      console.log(
        `💳 Processing ${paymentMethodType} payment with Payment Sheet...`
      );

      // Payment Sheet'i initialize et
      const baseConfig = {
        merchantDisplayName: "Metropolitan Food",
        paymentIntentClientSecret: clientSecret,
        returnURL: "metropolitan://payment-return",
      };

      // Belirli payment method'ları için konfigürasyon
      const initConfig =
        paymentMethodType === "card" || paymentMethodType === "blik"
          ? {
              ...baseConfig,
              allowsDelayedPaymentMethods: false,
            }
          : baseConfig;

      console.log(
        "🔧 Initializing Payment Sheet with config:",
        JSON.stringify(initConfig, null, 2)
      );
      const { error: initError } = await initPaymentSheet(initConfig);

      if (initError) {
        console.error("❌ Payment Sheet initialization error:", initError);
        console.error(
          "❌ Full error details:",
          JSON.stringify(initError, null, 2)
        );
        return {
          success: false,
          error:
            initError.localizedMessage ||
            initError.message ||
            t("payment.unknown_error"),
        };
      }

      console.log("✅ Payment Sheet initialized, presenting...");

      // Payment Sheet'i kullanıcıya göster
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        console.error("❌ Payment Sheet presentation error:", presentError);

        // User cancel durumunu handle et
        if (presentError.code === "Canceled") {
          return {
            success: false,
            error: t("payment.canceled"),
          };
        }

        // Diğer hatalar için mapping
        let errorMessage = t("payment.unknown_error");

        switch (presentError.code) {
          case "Failed":
            if (presentError.localizedMessage?.includes("authentication")) {
              errorMessage = t("payment.authentication_failed");
            } else if (
              presentError.localizedMessage?.includes("insufficient")
            ) {
              errorMessage = t("payment.insufficient_funds");
            } else if (presentError.localizedMessage?.includes("declined")) {
              errorMessage = t("payment.card_declined");
            } else {
              errorMessage =
                presentError.localizedMessage || t("payment.processing_error");
            }
            break;
          default:
            errorMessage =
              presentError.localizedMessage ||
              presentError.message ||
              t("payment.unknown_error");
        }

        return {
          success: false,
          error: errorMessage,
        };
      }

      console.log("✅ Payment completed successfully!");

      // Payment başarılı
      const paymentIntentId = clientSecret.split("_secret_")[0];

      return {
        success: true,
        clientSecret,
        paymentIntentId,
      };
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

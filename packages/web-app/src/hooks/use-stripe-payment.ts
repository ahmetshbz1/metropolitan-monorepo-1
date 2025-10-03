"use client";

import { loadStripe, Stripe } from "@stripe/stripe-js";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { stripeApi } from "@/services/api/stripe-api";

interface StripePaymentResult {
  success: boolean;
  error?: string;
}

let stripePromise: Promise<Stripe | null> | null = null;
let publishableKey: string | null = null;

const getStripe = async () => {
  if (!stripePromise) {
    // Backend'den publishable key al
    if (!publishableKey) {
      const config = await stripeApi.getConfig();
      publishableKey = config.publishableKey;

      console.log(`=== Stripe Configuration Web ===`);
      console.log(`Environment: ${config.environment}`);
      console.log(`Mode: ${config.mode}`);
      console.log(`Key Type: ${publishableKey.startsWith('pk_test_') ? 'TEST' : publishableKey.startsWith('pk_live_') ? 'LIVE' : 'UNKNOWN'}`);
      console.log(`Key Preview: ${publishableKey.substring(0, 15)}...`);
      console.log(`===================================`);
    }

    if (!publishableKey) {
      throw new Error("Stripe publishable key is not configured");
    }

    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

export const useStripePayment = () => {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const processPayment = async (
    clientSecret: string,
    paymentMethodType: string
  ): Promise<StripePaymentResult> => {
    setLoading(true);

    try {
      const stripe = await getStripe();

      if (!stripe) {
        return {
          success: false,
          error: t("payment.stripe_load_failed"),
        };
      }

      // Card and BLIK payments (Web için Payment Intent confirmation)
      if (paymentMethodType === "card" || paymentMethodType === "blik") {
        console.log(`💳 Confirming ${paymentMethodType} payment...`);
        
        const { error } = await stripe.confirmPayment({
          clientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/order/success`,
          },
          redirect: "if_required",
        });

        if (error) {
          console.error(`❌ ${paymentMethodType} payment failed:`, error);
          return {
            success: false,
            error: error.message || t("payment.payment_failed"),
          };
        }

        console.log(`✅ ${paymentMethodType} payment confirmed`);
        return { success: true };
      }

      // Apple Pay, Google Pay için
      if (paymentMethodType === "apple_pay" || paymentMethodType === "google_pay") {
        console.log(`📱 Confirming ${paymentMethodType} payment...`);
        
        const { error } = await stripe.confirmPayment({
          clientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/order/success`,
          },
        });

        if (error) {
          console.error(`❌ ${paymentMethodType} payment failed:`, error);
          return {
            success: false,
            error: error.message || t("payment.payment_failed"),
          };
        }

        console.log(`✅ ${paymentMethodType} payment confirmed`);
        return { success: true };
      }

      // Unsupported payment methods
      console.warn(`⚠️ Unsupported payment method: ${paymentMethodType}`);
      return {
        success: false,
        error: t("payment.unsupported_payment_method"),
      };
    } catch (error: any) {
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
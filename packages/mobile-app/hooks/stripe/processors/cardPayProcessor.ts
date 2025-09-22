//  "cardPayProcessor.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import { CardPaymentParams, StripePaymentResult } from '../types';
import { getPaymentSheetConfig } from '../config/paymentSheetConfig';
import { handlePaymentError } from '../utils/errorHandlers';
import { api } from '@/core/api';

export const processCardPayment = async ({
  clientSecret,
  paymentMethodType,
  initPaymentSheet,
  presentPaymentSheet,
  t,
  orderId // Add orderId parameter
}: CardPaymentParams & { orderId?: string }): Promise<StripePaymentResult> => {
  console.log(
    `💳 Processing ${paymentMethodType} payment with Payment Sheet...`
  );
  console.log("📦 Order ID:", orderId);

  // Payment Sheet'i initialize et
  const initConfig = getPaymentSheetConfig(clientSecret, paymentMethodType);

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

    // CRITICAL: Rollback stock if payment was cancelled/failed
    if (orderId && (presentError.code === 'Canceled' || presentError.code === 'Failed')) {
      console.log(`🔄 Payment ${presentError.code.toLowerCase()}, attempting stock rollback for order ${orderId}`);

      try {
        const rollbackResponse = await api.post(`/orders/${orderId}/rollback-stock`);
        console.log(`✅ Stock rollback successful:`, rollbackResponse.data);
      } catch (rollbackError: any) {
        console.error(`❌ Stock rollback failed for order ${orderId}:`, rollbackError);
        // Don't fail the payment error response due to rollback failure
        // Just log it for monitoring
      }
    }

    return handlePaymentError(presentError, t);
  }

  console.log("✅ Payment completed successfully!");

  // Payment başarılı
  const paymentIntentId = clientSecret.split("_secret_")[0];

  return {
    success: true,
    clientSecret,
    paymentIntentId,
  };
};

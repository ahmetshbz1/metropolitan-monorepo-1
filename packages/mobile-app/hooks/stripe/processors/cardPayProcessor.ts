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
  // 💳 Processing payment with Payment Sheet
  // Removed console statement

  // Payment Sheet'i initialize et
  const initConfig = getPaymentSheetConfig(clientSecret, paymentMethodType);

  // 🔧 Initializing Payment Sheet with config
  const { error: initError } = await initPaymentSheet(initConfig);

  if (initError) {
    // Removed console statement
    // ❌ Full error details
    return {
      success: false,
      error:
        initError.localizedMessage ||
        initError.message ||
        t("payment.unknown_error"),
    };
  }

  // Removed console statement

  // Payment Sheet'i kullanıcıya göster
  const { error: presentError } = await presentPaymentSheet();

  if (presentError) {
    // Removed console statement

    // CRITICAL: Rollback stock if payment was cancelled/failed
    if (orderId && (presentError.code === 'Canceled' || presentError.code === 'Failed')) {
      // Removed console statement}, attempting stock rollback for order ${orderId}`);

      try {
        await api.post(`/orders/${orderId}/rollback-stock`);
      } catch (rollbackError: unknown) {
        // Don't fail the payment error response due to rollback failure
        // Just log it for monitoring
      }
    }

    return handlePaymentError(presentError, t);
  }

  // Removed console statement

  // Payment başarılı
  const paymentIntentId = clientSecret.split("_secret_")[0];

  return {
    success: true,
    clientSecret,
    paymentIntentId,
  };
};

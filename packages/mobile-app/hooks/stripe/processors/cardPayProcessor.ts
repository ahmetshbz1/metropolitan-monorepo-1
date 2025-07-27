//  "cardPayProcessor.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import { CardPaymentParams, StripePaymentResult } from '../types';
import { getPaymentSheetConfig } from '../config/paymentSheetConfig';
import { handlePaymentError } from '../utils/errorHandlers';

export const processCardPayment = async ({
  clientSecret,
  paymentMethodType,
  initPaymentSheet,
  presentPaymentSheet,
  t
}: CardPaymentParams): Promise<StripePaymentResult> => {
  console.log(
    `💳 Processing ${paymentMethodType} payment with Payment Sheet...`
  );

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

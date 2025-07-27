//  "errorHandlers.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import { StripePaymentResult } from '../types';

export const handlePaymentError = (
  presentError: any,
  t: (key: string) => string
): StripePaymentResult => {
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
};

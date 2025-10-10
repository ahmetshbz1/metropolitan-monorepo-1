//  "paymentSheetConfig.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

export const getPaymentSheetConfig = (
  clientSecret: string,
  paymentMethodType?: string
) => {
  const baseConfig = {
    merchantDisplayName: "Metropolitan Food",
    paymentIntentClientSecret: clientSecret,
    returnURL: "metropolitan://payment-return",
  };

  // Belirli payment method'ları için konfigürasyon
  return paymentMethodType === "card" || paymentMethodType === "blik"
    ? {
        ...baseConfig,
        allowsDelayedPaymentMethods: false,
      }
    : baseConfig;
};

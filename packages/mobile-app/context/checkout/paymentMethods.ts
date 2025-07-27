//  "paymentMethods.ts"
//  metropolitan app
//  Created by Ahmet on 07.07.2025.

import { PaymentType, type CheckoutPaymentMethod } from "@metropolitan/shared";
import { Platform } from "react-native";

export const getAvailablePaymentMethods = (
  t: any,
  userType?: string
): CheckoutPaymentMethod[] => {
  const methods: CheckoutPaymentMethod[] = [
    // Her zaman mevcut olan kart ödemesi
    {
      id: "card",
      type: PaymentType.STRIPE,
      title: t("checkout.payment_methods.card.title"),
      subtitle: t("checkout.payment_methods.card.subtitle"),
      icon: "card-outline",
      isAvailable: true,
    },
    // BLIK - sadece Polonya için
    {
      id: "blik",
      type: PaymentType.BLIK,
      title: "BLIK",
      subtitle: t("checkout.payment_methods.blik.subtitle"),
      icon: "phone-portrait-outline",
      isAvailable: true,
    },
    // Apple Pay - iOS cihazlarda
    {
      id: "apple_pay",
      type: PaymentType.APPLE_PAY,
      title: "Apple Pay",
      subtitle: t("checkout.payment_methods.apple_pay.subtitle"),
      icon: "logo-apple",
      isAvailable: Platform.OS === "ios",
    },
    // Google Pay - Android cihazlarda
    {
      id: "google_pay",
      type: PaymentType.GOOGLE_PAY,
      title: "Google Pay",
      subtitle: t("checkout.payment_methods.google_pay.subtitle"),
      icon: "logo-google",
      isAvailable: Platform.OS === "android",
    },
    // Banka havalesi - sadece kurumsal müşteriler için
    {
      id: "bank_transfer",
      type: PaymentType.BANK_TRANSFER,
      title: t("checkout.payment_methods.bank_transfer.title"),
      subtitle: t("checkout.payment_methods.bank_transfer.subtitle"),
      icon: "cash-outline",
      isAvailable: userType === "corporate",
    },
  ];

  return methods.filter((method) => method.isAvailable);
};
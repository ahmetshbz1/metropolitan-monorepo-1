//  "paymentFormatters.ts"
//  metropolitan app
//  Created by Ahmet on 04.07.2025.

export const getPaymentMethodName = (
  cardTypeOrPaymentType: string | null,
  t: (key: string) => string
) => {
  if (!cardTypeOrPaymentType) {
    return t("order_detail.payment.credit_card");
  }

  // Stripe payment method types
  switch (cardTypeOrPaymentType.toLowerCase()) {
    case "card":
      return t("payment_methods.card.title");
    case "bank_transfer":
      return t("payment_methods.bank_transfer.title");
    case "visa":
      return "Visa Kartı";
    case "mastercard":
      return "Mastercard Kartı";
    case "maestro":
      return "Maestro Kartı";
    default:
      // Fallback için card type olarak kullan
      return `${cardTypeOrPaymentType} Kartı`;
  }
};

export const formatCardNumber = (cardNumberLast4: string) => {
  return `**** **** **** ${cardNumberLast4}`;
};

export const isPaymentExpandable = (
  cardholderName?: string,
  cardNumberLast4?: string
) => {
  return !!cardholderName && !!cardNumberLast4;
};

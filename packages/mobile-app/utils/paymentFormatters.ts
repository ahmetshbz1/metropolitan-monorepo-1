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
    case "apple_pay":
      return "Apple Pay";
    case "google_pay":
      return "Google Pay";
    case "blik":
      return "BLIK";
    case "visa":
      return "Visa";
    case "mastercard":
      return "Mastercard";
    case "maestro":
      return "Maestro";
    default:
      // Fallback - capitalize first letter
      return cardTypeOrPaymentType.charAt(0).toUpperCase() + cardTypeOrPaymentType.slice(1);
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

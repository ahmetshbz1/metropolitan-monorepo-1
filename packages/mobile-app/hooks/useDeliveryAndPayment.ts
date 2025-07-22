//  "useDeliveryAndPayment.ts"
//  metropolitan app
//  Created by Ahmet on 12.07.2025.

import { OrderDetail } from "@/context/OrderContext";
import { formatOrderAddresses } from "@/utils/addressFormatters";
import {
  formatCardNumber,
  getPaymentMethodName,
  isPaymentExpandable,
} from "@/utils/paymentFormatters";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LayoutAnimation } from "react-native";

export const useDeliveryAndPayment = (order: OrderDetail) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useTranslation();

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const { shippingAddress, billingAddress } = formatOrderAddresses(order);

  // Stripe siparişleri için paymentMethod null olabilir, paymentMethodType kullanmalıyız
  const isStripePayment = !!order.paymentMethodType && !order.paymentMethod;

  let paymentMethodName: string;
  let paymentMethodValue: string;
  let paymentExpandable: boolean;
  let cardholderName: string | undefined;

  if (isStripePayment) {
    // Stripe payment için
    paymentMethodName = getPaymentMethodName(order.paymentMethodType, t);
    paymentMethodValue = t("order_detail.delivery_payment.stripe_payment");
    paymentExpandable = false;
    cardholderName = undefined;
  } else if (order.paymentMethod) {
    // Traditional payment method için
    paymentMethodName = getPaymentMethodName(order.paymentMethod.cardType, t);
    paymentMethodValue = formatCardNumber(order.paymentMethod.cardNumberLast4);
    paymentExpandable = isPaymentExpandable(
      order.paymentMethod.cardholderName,
      order.paymentMethod.cardNumberLast4
    );
    cardholderName = order.paymentMethod.cardholderName;
  } else {
    // Fallback
    paymentMethodName = t("order_detail.delivery_payment.unknown_payment");
    paymentMethodValue = "";
    paymentExpandable = false;
    cardholderName = undefined;
  }

  return {
    isExpanded,
    toggleExpand,
    shippingAddress,
    billingAddress,
    paymentMethodName,
    paymentMethodValue,
    paymentExpandable,
    cardholderName,
    t,
  };
};

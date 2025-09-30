//  "useCheckoutSummary.ts"
//  metropolitan app
//  Created by Ahmet on 15.07.2025.
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useCart } from "@/context/CartContext";
import { useCheckout } from "@/context/CheckoutContext";
import { useOrders } from "@/context/OrderContext";
import { useStripePayment } from "@/hooks/useStripePayment";

export function useCheckoutSummary() {
  const { t } = useTranslation();
  const router = useRouter();
  const { clearCart } = useCart();
  const { createOrder, loading: orderLoading } = useOrders();
  const { state, canProceedToNext, resetCheckout } = useCheckout();
  const { deliveryAddress, selectedPaymentMethod } = state;
  const { processPayment, loading: paymentLoading } = useStripePayment();

  const [isProcessing, setIsProcessing] = useState(false);

  const isLoading = orderLoading || paymentLoading || isProcessing;

  // Payment method checks
  const isStripePayment = selectedPaymentMethod
    ? ["card", "apple_pay", "google_pay", "blik"].includes(
        selectedPaymentMethod.id
      )
    : false;
  const isBankTransfer = selectedPaymentMethod?.id === "bank_transfer";

  const handleCreateOrder = async () => {
    if (!deliveryAddress || !selectedPaymentMethod) {
      throw new Error(t("checkout.missing_fields"));
    }

    setIsProcessing(true);

    try {
      // Removed console statement
      // Removed console statement
      // Removed console statement

      // Stripe payment flow (card, Apple Pay, Google Pay, BLIK)
      if (isStripePayment) {
        // Removed console statement

        const orderData = {
          shippingAddressId: deliveryAddress.id,
          billingAddressId: state.billingAddressSameAsDelivery
            ? deliveryAddress.id // Use shipping address as billing if same
            : state.billingAddress?.id,
          paymentMethodId: selectedPaymentMethod.id,
          notes: state.notes || undefined,
        };

        // Backend'e sipariş oluştur ve Payment Intent al
        const orderResponse = await createOrder(orderData);

        // Removed console statement

        // Response yapısını kontrol et
        if (!orderResponse || !orderResponse.order) {
          throw new Error(t("order.creation_failed"));
        }

        const { order } = orderResponse;
        const clientSecret = order.stripeClientSecret;

        if (!clientSecret) {
          throw new Error(t("payment.client_secret_missing"));
        }

        // 🔑 Processing Stripe payment with clientSecret

        // Stripe ile 3D Secure authentication yap
        // 🔧 Processing payment with method
        // Format amount for Apple Pay (expected as string)
        // Backend sends totalAmount as string ("15.50"), convert to number first
        const formattedAmount = order.totalAmount
          ? parseFloat(order.totalAmount).toFixed(2)
          : "0.00";

        const paymentResult = await processPayment(
          clientSecret,
          selectedPaymentMethod.id,
          formattedAmount,
          order.currency || "PLN",
          order.id // Pass orderId for rollback
        );

        if (!paymentResult.success) {
          // Removed console statement
          throw new Error(paymentResult.error || t("checkout.payment_error"));
        }

        // Payment başarılı - webhook otomatik olarak order'ı güncelleyecek
        // Removed console statement

        await clearCart();
        resetCheckout();
        
        // Direkt sipariş detay sayfasına yönlendir
        router.replace({
          pathname: "/order/[id]",
          params: { id: order.id }
        });
      }
      // Bank transfer flow (existing logic)
      else if (isBankTransfer) {
        console.log("🔍 Payment Term Days:", state.paymentTermDays);

        const orderData = await createOrder({
          shippingAddressId: deliveryAddress.id,
          billingAddressId: state.billingAddressSameAsDelivery
            ? undefined
            : state.billingAddress?.id,
          paymentMethodId: selectedPaymentMethod.id,
          notes: state.notes || undefined,
          paymentTermDays: state.paymentTermDays !== null ? state.paymentTermDays : undefined,
        });

        // Removed console statement

        // Check if the order was created successfully
        if (orderData?.order?.id) {
          const orderId = orderData.order.id;
          await clearCart();
          resetCheckout();
          
          // Direkt sipariş detay sayfasına yönlendir
          router.replace({
            pathname: "/order/[id]",
            params: { id: orderId },
          });
        } else {
          // Removed console statement
          throw new Error(t("checkout.order_creation_failed"));
        }
      }
    } catch (error: any) {
      // Removed console statement
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        t("checkout.order_creation_failed");
      throw new Error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isCreatingOrder: isProcessing,
    orderLoading,
    isBankTransfer,
    isStripePayment,
    handleCreateOrder,
  };
}

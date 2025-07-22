//  "summary.tsx"
//  metropolitan app
//  Created by Ahmet on 08.06.2025.
//  Modified by Ahmet on 15.07.2025.
//  Updated by Ahmet on 22.07.2025. - Keyboard handling improved

import { useFocusEffect } from "expo-router";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ProgressIndicator } from "@/components/checkout/ProgressIndicator";
import { DeliveryAddressSummary } from "@/components/checkout/summary/DeliveryAddressSummary";
import { OrderNotes } from "@/components/checkout/summary/OrderNotes";
import { OrderTotals } from "@/components/checkout/summary/OrderTotals";
import { PaymentMethodSummary } from "@/components/checkout/summary/PaymentMethodSummary";
import { SummaryFooter } from "@/components/checkout/summary/SummaryFooter";
import { useCart } from "@/context/CartContext";
import { useCheckout } from "@/context/CheckoutContext";
import { useCheckoutSummary } from "@/hooks/useCheckoutSummary";
import { useToast } from "@/hooks/useToast";

export default function CheckoutSummaryScreen() {
  const { t } = useTranslation();
  const { summary } = useCart();
  const { setCurrentStep } = useCheckout();
  const { showToast } = useToast();
  const { isCreatingOrder, orderLoading, isBankTransfer, handleCreateOrder } =
    useCheckoutSummary();

  useFocusEffect(
    useCallback(() => {
      setCurrentStep(3);
    }, [setCurrentStep])
  );

  if (!summary) {
    return (
      <ThemedView className="flex-1 justify-center items-center">
        <ThemedText>{t("common.loading")}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <ProgressIndicator />
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={200} // Footer yüksekliği + input görünürlüğü
        extraKeyboardSpace={0} // Ekstra scroll alanı kaldırıldı
      >
        <View className="p-5 gap-6" style={{ paddingBottom: 0 }}>
          <DeliveryAddressSummary />
          <PaymentMethodSummary />
          <OrderTotals />
          <OrderNotes />
        </View>
      </KeyboardAwareScrollView>
      <SummaryFooter
        isBankTransfer={isBankTransfer}
        isCreatingOrder={isCreatingOrder}
        orderLoading={orderLoading}
        onPress={async () => {
          try {
            await handleCreateOrder();
            if (isBankTransfer) {
              showToast(t("checkout.bank_transfer_success"), "success");
            } else {
              showToast(t("checkout.payment_success"), "success");
            }
          } catch (error: any) {
            showToast(
              error.message || t("checkout.order_creation_failed"),
              "error"
            );
          }
        }}
      />
    </ThemedView>
  );
}

//  "summary.tsx"
//  metropolitan app
//  Created by Ahmet on 08.06.2025.
//  Modified by Ahmet on 15.07.2025.
//  Updated by Ahmet on 22.07.2025. - Keyboard handling improved

import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useLayoutEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { InteractionManager, Platform, View } from "react-native";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { BankTransferBottomSheet } from "@/components/checkout/BankTransferBottomSheet";
import { ProgressIndicator } from "@/components/checkout/ProgressIndicator";
import { DeliveryAddressSummary } from "@/components/checkout/summary/DeliveryAddressSummary";
import { OrderNotes } from "@/components/checkout/summary/OrderNotes";
import { OrderTotals } from "@/components/checkout/summary/OrderTotals";
import { PaymentMethodSummary } from "@/components/checkout/summary/PaymentMethodSummary";
import { PaymentTermSelector } from "@/components/checkout/summary/PaymentTermSelector";
import { SummaryFooter } from "@/components/checkout/summary/SummaryFooter";
import { useCart } from "@/context/CartContext";
import { useCheckout } from "@/context/CheckoutContext";
import { useCheckoutSummary } from "@/hooks/useCheckoutSummary";
import { useToast } from "@/hooks/useToast";

export default function CheckoutSummaryScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { summary, flushPendingUpdates } = useCart();
  const { state, setCurrentStep } = useCheckout();
  const { showToast } = useToast();
  const { isCreatingOrder, orderLoading, isBankTransfer, handleCreateOrder } =
    useCheckoutSummary();
  const bankTransferSheetRef = useRef<BottomSheetModal>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("checkout.steps.summary"),
      headerBackTitle: "",
      headerBackTitleVisible: false,
      headerBackButtonDisplayMode: "minimal" as const,
      ...Platform.select({
        ios: {
          headerBackTitleStyle: { fontSize: 0 },
          headerBackButtonMenuEnabled: false,
        },
      }),
    } as any);
  }, [navigation, t]);

  const isMountedRef = useRef(true);

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        if (isMountedRef.current && state.currentStep !== 3) {
          setCurrentStep(3);
        }
        flushPendingUpdates().catch(() => {
          // Sessizce hataları yakala
        });
      });

      return () => {
        task.cancel();
      };
    }, [state.currentStep, setCurrentStep, flushPendingUpdates])
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
          <PaymentMethodSummary
            onViewBankDetails={() => bankTransferSheetRef.current?.present()}
          />
          <PaymentTermSelector />
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
            // Sipariş oluşturmadan önce pending updates'leri senkronize et
            await flushPendingUpdates();

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
      <BankTransferBottomSheet ref={bankTransferSheetRef} />
    </ThemedView>
  );
}

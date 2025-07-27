//  "address.tsx"
//  metropolitan app
//  Created by Ahmet on 25.06.2025.

import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { BaseButton } from "@/components/base/BaseButton";
import { AddressSection } from "@/components/checkout/AddressSection";
import { BillingAddressToggle } from "@/components/checkout/BillingAddressToggle";
import { ProgressIndicator } from "@/components/checkout/ProgressIndicator";
import Colors from "@/constants/Colors";
import { useAddresses } from "@/context/AddressContext";
import { useCheckout } from "@/context/CheckoutContext";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function CheckoutAddressScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const { addresses, loading: addressesLoading } = useAddresses();
  const {
    state,
    setDeliveryAddress,
    setBillingAddress,
    setBillingAddressSameAsDelivery,
    nextStep,
    canProceedToNext,
    setCurrentStep,
  } = useCheckout();

  // Auto-select defaults
  useEffect(() => {
    if (addresses.length > 0 && !state.deliveryAddress) {
      const defaultAddress = addresses[0];
      setDeliveryAddress(defaultAddress);
    }
  }, [addresses, state.deliveryAddress, setDeliveryAddress]);

  useFocusEffect(
    useCallback(() => {
      setCurrentStep(1);
    }, [setCurrentStep])
  );

  const handleNext = () => {
    if (canProceedToNext()) {
      nextStep();
      router.push("/checkout/payment");
    }
  };

  if (addressesLoading) {
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
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="p-5 gap-6">
          {/* Delivery Address Section */}
          <AddressSection
            title={t("checkout.delivery_address")}
            addresses={addresses}
            selectedAddressId={state.deliveryAddress?.id}
            onSelectAddress={setDeliveryAddress}
            showAddButton={true}
          />

          {/* Billing Address Toggle */}
          <BillingAddressToggle
            value={state.billingAddressSameAsDelivery}
            onValueChange={setBillingAddressSameAsDelivery}
          />

          {/* Billing Address Section (if different) */}
          {!state.billingAddressSameAsDelivery && (
            <AddressSection
              title={t("checkout.billing_address")}
              addresses={addresses}
              selectedAddressId={state.billingAddress?.id}
              onSelectAddress={setBillingAddress}
              showAddButton={false}
            />
          )}
        </View>
      </KeyboardAwareScrollView>

      <KeyboardStickyView>
        <View
          className="p-5"
          style={{
            paddingBottom: insets.bottom + 20,
            backgroundColor: colors.background,
          }}
        >
          <BaseButton
            variant="primary"
            size="small"
            title={t("checkout.continue_to_payment")}
            onPress={handleNext}
            disabled={!canProceedToNext()}
            fullWidth
          />
        </View>
      </KeyboardStickyView>
    </ThemedView>
  );
}

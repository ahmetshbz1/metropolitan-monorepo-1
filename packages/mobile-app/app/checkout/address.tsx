//  "address.tsx"
//  metropolitan app
//  Created by Ahmet on 25.06.2025.

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Switch, TouchableOpacity, View } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { BaseButton } from "@/components/base/BaseButton";
import { BaseCard } from "@/components/base/BaseCard";
import { ProgressIndicator } from "@/components/checkout/ProgressIndicator";
import Colors, { ColorUtils } from "@/constants/Colors";
import { useAddresses } from "@/context/AddressContext";
import { Address } from "@metropolitan/shared/types/address";
import { useCheckout } from "@/context/CheckoutContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useHaptics } from "@/hooks/useHaptics";

export default function CheckoutAddressScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { withHapticFeedback } = useHaptics();

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

  const renderAddressCard = (
    address: Address,
    isSelected: boolean,
    onSelect: () => void
  ) => (
    <Pressable
      key={address.id}
      onPress={withHapticFeedback(onSelect)}
      android_ripple={{ color: "transparent" }}
      style={{ marginBottom: 12 }}
    >
      <BaseCard
        style={{
          borderWidth: 2,
          borderColor: isSelected ? colors.tint : colors.border,
          backgroundColor: isSelected
            ? colorScheme === "dark"
              ? ColorUtils.withOpacity(colors.tint, 0.3)
              : colors.tintLight
            : colors.card,
        }}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 mr-2">
            <ThemedText className="font-semibold text-lg mb-1">
              {address.addressTitle}
            </ThemedText>
            <ThemedText className="opacity-70 leading-5">
              {address.street}, {address.city}, {address.postalCode}
            </ThemedText>
          </View>

          <View className="flex-row items-center" style={{ gap: 16 }}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                router.push({
                  pathname: "/edit-address",
                  params: { addressId: address.id },
                });
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="create-outline"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <View
              className="w-6 h-6 rounded-full border-2 justify-center items-center"
              style={{
                borderColor: isSelected ? colors.tint : colors.mediumGray,
              }}
            >
              {isSelected && (
                <View
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors.tint }}
                />
              )}
            </View>
          </View>
        </View>
      </BaseCard>
    </Pressable>
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
          {/* Teslimat Adresi */}
          <View>
            <ThemedText className="text-lg font-semibold mb-4">
              {t("checkout.delivery_address")}
            </ThemedText>

            {addresses.map((address) =>
              renderAddressCard(
                address,
                state.deliveryAddress?.id === address.id,
                () => setDeliveryAddress(address)
              )
            )}

            <BaseButton
              variant="secondary"
              size="medium"
              title={`+ ${t("checkout.add_new_address")}`}
              onPress={() => router.push("/add-address")}
              style={{ marginTop: 8 }}
            />
          </View>

          {/* Fatura Adresi Toggle */}
          <View>
            <BaseCard>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color={colors.textSecondary}
                  />
                  <ThemedText className="ml-2 font-medium">
                    {t("checkout.same_billing_address")}
                  </ThemedText>
                </View>
                <Switch
                  value={state.billingAddressSameAsDelivery}
                  onValueChange={setBillingAddressSameAsDelivery}
                  trackColor={{ false: colors.border, true: colors.tint }}
                  thumbColor={
                    state.billingAddressSameAsDelivery ? "#fff" : "#f4f3f4"
                  }
                />
              </View>
            </BaseCard>
          </View>

          {/* Fatura Adresi (eğer farklı seçilmişse) */}
          {!state.billingAddressSameAsDelivery && (
            <View>
              <ThemedText className="text-lg font-semibold mb-4">
                {t("checkout.billing_address")}
              </ThemedText>

              {addresses.map((address) =>
                renderAddressCard(
                  address,
                  state.billingAddress?.id === address.id,
                  () => setBillingAddress(address)
                )
              )}
            </View>
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
            size="medium"
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

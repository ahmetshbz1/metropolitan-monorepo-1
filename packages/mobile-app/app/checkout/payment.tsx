//  "payment.tsx"
//  metropolitan app
//  Created by Ahmet on 07.07.2025.

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
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
import { useCheckout } from "@/context/CheckoutContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useHaptics } from "@/hooks/useHaptics";
import { CheckoutPaymentMethod } from "@metropolitan/shared/types/checkout";

export default function CheckoutPaymentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { withHapticFeedback } = useHaptics();
  const {
    state,
    setPaymentMethod,
    getAvailablePaymentMethods,
    nextStep,
    canProceedToNext,
    setCurrentStep,
  } = useCheckout();

  const availablePaymentMethods = getAvailablePaymentMethods();

  useFocusEffect(
    useCallback(() => {
      setCurrentStep(2);
    }, [setCurrentStep])
  );

  const handleSelectPaymentMethod = (method: CheckoutPaymentMethod) => {
    setPaymentMethod(method);
    if (method.id === "bank_transfer") {
      router.push("/checkout/bank-transfer");
    }
  };

  const renderPaymentMethodCard = (
    method: CheckoutPaymentMethod,
    isSelected: boolean,
    onSelect: () => void
  ) => (
    <Pressable
      key={method.id}
      onPress={withHapticFeedback(() => onSelect())}
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
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View
              className="w-12 h-12 rounded-xl items-center justify-center mr-4"
              style={{ backgroundColor: colors.background }}
            >
              <Ionicons
                name={method.icon as any}
                size={24}
                color={isSelected ? colors.tint : colors.textSecondary}
              />
            </View>
            <View className="flex-1">
              <ThemedText className="font-semibold text-base">
                {method.title}
              </ThemedText>
              {method.subtitle && (
                <ThemedText className="text-sm opacity-80 mt-0.5">
                  {method.subtitle}
                </ThemedText>
              )}
              {/* Geçici kart bilgisi gösterimi */}
              {method.cardInfo && (
                <ThemedText className="text-sm opacity-70 mt-1">
                  {method.cardInfo.cardType} ****{" "}
                  {method.cardInfo.cardNumberLast4}
                </ThemedText>
              )}
            </View>
          </View>
          <View className="ml-3">
            <Ionicons
              name={isSelected ? "radio-button-on" : "radio-button-off"}
              size={24}
              color={isSelected ? colors.tint : colors.border}
            />
          </View>
        </View>
      </BaseCard>
    </Pressable>
  );

  const handleNext = () => {
    if (canProceedToNext()) {
      nextStep();
      router.push("/checkout/summary");
    }
  };

  return (
    <ThemedView className="flex-1">
      <ProgressIndicator />
      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="p-5 gap-6">
          {/* Ödeme Yöntemleri */}
          <View>
            <ThemedText className="text-lg font-semibold mb-4">
              {t("checkout.payment_screen_title")}
            </ThemedText>

            <View>
              {availablePaymentMethods.map((method) =>
                renderPaymentMethodCard(
                  method,
                  state.selectedPaymentMethod?.id === method.id,
                  () => handleSelectPaymentMethod(method)
                )
              )}
            </View>
          </View>

          {/* Güvenlik Bilgisi */}
          <BaseCard>
            <View className="flex-row items-start">
              <Ionicons
                name="shield-checkmark-outline"
                size={24}
                color={colors.success}
              />
              <View className="ml-3 flex-1">
                <ThemedText className="font-semibold text-base mb-1">
                  {t("checkout.secure_payment")}
                </ThemedText>
                <ThemedText className="text-sm opacity-80">
                  {t("checkout.secure_payment_desc")}
                </ThemedText>
              </View>
            </View>
          </BaseCard>

          {/* Gelecekte eklenecek özellikler */}
          <View className="mt-4">
            <ThemedText className="text-sm opacity-60 text-center">
              {t("checkout.more_payment_methods_soon")}
            </ThemedText>
          </View>
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
            title={t("checkout.continue_to_summary")}
            onPress={handleNext}
            disabled={!canProceedToNext()}
            fullWidth
          />
        </View>
      </KeyboardStickyView>
    </ThemedView>
  );
}

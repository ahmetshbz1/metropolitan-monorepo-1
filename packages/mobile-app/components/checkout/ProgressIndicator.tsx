//  "ProgressIndicator.tsx"
//  metropolitan app
//  Created by Ahmet on 02.06.2025.

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useCheckout } from "@/context/CheckoutContext";
import { useColorScheme } from "@/hooks/useColorScheme";

export function ProgressIndicator() {
  const { state } = useCheckout();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { t } = useTranslation();

  const steps = [
    { number: 1, title: t("checkout.steps.address") },
    { number: 2, title: t("checkout.steps.payment") },
    { number: 3, title: t("checkout.steps.summary") },
  ];

  return (
    <ThemedView
      className="px-5 py-4 border-b"
      style={{
        backgroundColor: colors.cardBackground,
        borderBottomColor: colors.border,
      }}
    >
      <View className="flex-row items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <View className="flex-row items-center">
              <View
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{
                  backgroundColor:
                    step.number <= state.currentStep
                      ? colors.tint
                      : colors.border,
                }}
              >
                {step.number < state.currentStep ? (
                  <Ionicons name="checkmark" size={16} color="white" />
                ) : (
                  <ThemedText
                    className="text-sm font-semibold"
                    style={{
                      color:
                        step.number === state.currentStep
                          ? "white"
                          : colors.textSecondary,
                    }}
                  >
                    {step.number}
                  </ThemedText>
                )}
              </View>
              <ThemedText
                className="ml-2 text-sm font-medium"
                style={{
                  color:
                    step.number <= state.currentStep
                      ? colors.text
                      : colors.textSecondary,
                }}
              >
                {step.title}
              </ThemedText>
            </View>
            {index < steps.length - 1 && (
              <View
                className="flex-1 h-0.5 mx-3"
                style={{
                  backgroundColor:
                    step.number < state.currentStep
                      ? colors.tint
                      : colors.border,
                }}
              />
            )}
          </React.Fragment>
        ))}
      </View>
    </ThemedView>
  );
}

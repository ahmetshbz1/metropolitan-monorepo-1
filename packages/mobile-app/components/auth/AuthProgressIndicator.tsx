//  "AuthProgressIndicator.tsx"
//  metropolitan app
//  Created by Ahmet on 23.09.2025.

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

interface AuthProgressIndicatorProps {
  currentStep: number;
}

export function AuthProgressIndicator({ currentStep }: AuthProgressIndicatorProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const steps = [
    { number: 1, title: "Telefon" },
    { number: 2, title: "Doğrulama" },
    { number: 3, title: "Bilgiler" },
  ];

  return (
    <View
      className="px-5 py-3 border-b"
      style={{
        backgroundColor: colors.background,
        borderBottomColor: colors.border,
        borderBottomWidth: 0.5,
      }}
    >
      <View className="flex-row items-center">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            {/* Step circle and title */}
            <View className="items-center">
              <View
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{
                  backgroundColor:
                    step.number <= currentStep
                      ? colors.tint
                      : colors.border,
                }}
              >
                {step.number < currentStep ? (
                  <Ionicons name="checkmark" size={16} color="white" />
                ) : (
                  <ThemedText
                    className="text-sm font-semibold"
                    style={{
                      color:
                        step.number === currentStep
                          ? "white"
                          : colors.textSecondary,
                    }}
                  >
                    {step.number}
                  </ThemedText>
                )}
              </View>
              <ThemedText
                className="mt-1.5 text-xs"
                style={{
                  color:
                    step.number <= currentStep
                      ? colors.text
                      : colors.textSecondary,
                  fontWeight: step.number === currentStep ? "600" : "400",
                }}
              >
                {step.title}
              </ThemedText>
            </View>

            {/* Line between steps */}
            {index < steps.length - 1 && (
              <View
                className="flex-1 h-0.5 mx-2"
                style={{
                  backgroundColor:
                    step.number < currentStep
                      ? colors.tint
                      : colors.border,
                }}
              />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}
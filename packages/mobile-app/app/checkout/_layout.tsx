//  "_layout.tsx"
//  metropolitan app
//  Created by Ahmet on 03.07.2025.

import { Stack } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";

import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { CheckoutProvider } from "@/context/CheckoutContext";
import { useColorScheme } from "@/hooks/useColorScheme";

// This hides the header for the parent navigator.
// We are now handling this in the root _layout.tsx to avoid conflicts.
// export const options = { headerShown: false };

function CheckoutLayoutContent() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <ThemedView className="flex-1">
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: "600",
            fontSize: 17,
            color: colors.text,
          },
          headerTitleAlign: "center",
        }}
      >
        <Stack.Screen
          name="address"
          options={{
            title: t("checkout.steps.address"),
          }}
        />
        <Stack.Screen
          name="payment"
          options={{
            title: t("checkout.steps.payment"),
          }}
        />
        <Stack.Screen
          name="summary"
          options={{
            title: t("checkout.steps.summary"),
          }}
        />
        <Stack.Screen
          name="bank-transfer"
          options={{
            title: t("checkout.bank_transfer_title"),
            presentation: "modal",
          }}
        />
      </Stack>
    </ThemedView>
  );
}

export default function CheckoutLayout() {
  return (
    <CheckoutProvider>
      <CheckoutLayoutContent />
    </CheckoutProvider>
  );
}

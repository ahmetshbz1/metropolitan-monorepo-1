//  "bank-transfer.tsx"
//  metropolitan app
//  Created by Ahmet on 05.06.2025.

import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/ThemedView";
import { BaseButton } from "@/components/base/BaseButton";
import { BaseCard } from "@/components/base/BaseCard";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useHaptics } from "@/hooks/useHaptics";

export default function BankTransferScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { triggerHaptic } = useHaptics();
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const bankDetails = [
    {
      label: t("bank_transfer.recipient"),
      value: "METROPOLITAN FOOD GROUP Sp. z o.o.",
    },
    { label: "IBAN (PLN)", value: "PL 12 3456 7890 1234 5678 9012 3456" },
    { label: "IBAN (EUR)", value: "PL 98 7654 3210 9876 5432 1098 7654" },
    { label: t("bank_transfer.bank_name"), value: "Santander Bank polska" },
  ];

  const handleCopyToClipboard = (value: string, label: string) => {
    Clipboard.setStringAsync(value);
    triggerHaptic("success");
    setCopiedItem(label);
    setTimeout(() => {
      setCopiedItem(null);
    }, 2000);
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <ThemedView className="flex-1">
      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-6">
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: `${colors.tint}20` }}
          >
            <Ionicons name="cash-outline" size={32} color={colors.tint} />
          </View>
          <Text
            className="text-2xl font-bold text-center"
            style={{ color: colors.text }}
          >
            {t("bank_transfer.title")}
          </Text>
          <Text
            className="text-base text-center mt-2 opacity-80"
            style={{ color: colors.text }}
          >
            {t("bank_transfer.subtitle")}
          </Text>
        </View>

        <BaseCard>
          <Text
            className="text-lg font-semibold mb-4"
            style={{ color: colors.text }}
          >
            {t("bank_transfer.account_details")}
          </Text>
          <View className="space-y-4">
            {bankDetails.map((detail, index) => (
              <View key={index}>
                <Text
                  className="text-sm font-medium opacity-60 mb-1"
                  style={{ color: colors.text }}
                >
                  {detail.label}
                </Text>
                <View className="flex-row items-center justify-between">
                  <Text
                    className="text-base font-semibold"
                    style={{ color: colors.text }}
                    selectable
                  >
                    {detail.value}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      handleCopyToClipboard(detail.value, detail.label)
                    }
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {copiedItem === detail.label ? (
                      <Ionicons
                        name="checkmark-done"
                        size={22}
                        color={colors.success}
                      />
                    ) : (
                      <Ionicons
                        name="copy-outline"
                        size={22}
                        color={colors.textSecondary}
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <View>
              <Text
                className="text-sm font-medium opacity-60 mb-1"
                style={{ color: colors.text }}
              >
                {t("bank_transfer.description_label")}
              </Text>
              <Text
                className="text-base font-semibold"
                style={{ color: colors.danger }}
              >
                {t("bank_transfer.description_value")}
              </Text>
            </View>
          </View>
        </BaseCard>

        <View
          className="mt-6 p-4 rounded-xl flex-row items-center"
          style={{ backgroundColor: `${colors.tint}15` }}
        >
          <Ionicons
            name="information-circle-outline"
            size={24}
            color={colors.tint}
          />
          <Text
            className="text-sm ml-3 flex-1 leading-5"
            style={{ color: colors.tint }}
          >
            {t("bank_transfer.info_text")}
          </Text>
        </View>
        <View style={{ height: 40 }} />
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
            title={t("bank_transfer.confirm_button")}
            onPress={handleGoBack}
            fullWidth
          />
        </View>
      </KeyboardStickyView>
    </ThemedView>
  );
}

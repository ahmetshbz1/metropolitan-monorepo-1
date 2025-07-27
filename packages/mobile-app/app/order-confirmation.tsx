//  "order-confirmation.tsx"
//  metropolitan app
//  Created by Ahmet on 01.07.2025.

import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BaseButton } from "@/components/base/BaseButton";
import { BaseCard } from "@/components/base/BaseCard";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useHaptics } from "@/hooks/useHaptics";

export default function OrderConfirmationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { triggerHaptic } = useHaptics();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const bankDetails = [
    {
      label: t("bank_transfer.recipient"),
      value: "Yayla Agro Gıda A.Ş.",
      copyable: true,
    },
    {
      label: "IBAN (PLN)",
      value: "PL 12 3456 7890 1234 5678 9012 3456",
      copyable: true,
    },
    {
      label: "IBAN (EUR)",
      value: "PL 98 7654 3210 9876 5432 1098 7654",
      copyable: true,
    },
    {
      label: t("bank_transfer.bank_name"),
      value: "ABC Bank S.A.",
      copyable: true,
    },
    {
      label: t("bank_transfer.description_label"),
      value: orderId,
      copyable: true,
      isOrderId: true,
    },
  ];

  const handleCopyToClipboard = (value: string, label: string) => {
    Clipboard.setStringAsync(value);
    triggerHaptic("success");
    setCopiedItem(label);
    setTimeout(() => {
      setCopiedItem(null);
    }, 2000);
  };

  const handleGoToOrders = () => {
    router.replace("/(tabs)/orders");
  };

  return (
    <ThemedView className="flex-1">
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 150 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-6">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: colors.success + "20" }}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={48}
              color={colors.success}
            />
          </View>
          <Text
            className="text-2xl font-bold text-center"
            style={{ color: colors.text }}
          >
            {t("order_confirmation.title")}
          </Text>
          <Text
            className="text-base text-center mt-2 opacity-80"
            style={{ color: colors.text }}
          >
            {t("order_confirmation.subtitle")}
          </Text>
        </View>

        <BaseCard>
          <Text
            className="text-lg font-semibold mb-4"
            style={{ color: colors.text }}
          >
            {t("order_confirmation.payment_details_title")}
          </Text>
          <View className="space-y-4">
            {bankDetails.map((detail) => (
              <View key={detail.label}>
                <Text
                  className="text-sm font-medium opacity-60 mb-1"
                  style={{ color: colors.text }}
                >
                  {detail.label}
                </Text>
                <View className="flex-row items-center justify-between">
                  <Text
                    className="text-base font-semibold"
                    style={{
                      color: detail.isOrderId ? colors.danger : colors.text,
                      flexShrink: 1,
                    }}
                    selectable
                  >
                    {detail.value}
                  </Text>
                  {detail.copyable && (
                    <TouchableOpacity
                      onPress={() =>
                        handleCopyToClipboard(detail.value, detail.label)
                      }
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      className="pl-2"
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
                  )}
                </View>
              </View>
            ))}
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
            {t("order_confirmation.info_text")}
          </Text>
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomContainer,
          {
            paddingBottom: insets.bottom + 20,
            borderTopColor: colors.border,
            backgroundColor: colors.cardBackground,
          },
        ]}
      >
        <BaseButton
          variant="primary"
          size="small"
          title={t("order_confirmation.button_text")}
          onPress={handleGoToOrders}
          fullWidth
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
  },
});

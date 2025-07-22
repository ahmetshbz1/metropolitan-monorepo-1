//  "PaymentMethodCard.tsx"
//  metropolitan app
//  Created by Ahmet on 03.07.2025.

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Alert, TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { BaseCard } from "@/components/base/BaseCard";
import { ThemedText } from "@/components/ThemedText";
import Colors from "@/constants/Colors";
import { usePaymentMethods } from "@/context/PaymentMethodContext";
import { useColorScheme } from "@/hooks/useColorScheme";

export type PaymentMethod = {
  id: string;
  type: string;
  name: string;
  details: string;
  expiry: string;
  isDefault: boolean;
};

const VisaIcon = () => (
  <Svg width="38" height="24" viewBox="0 0 38 24" fill="none">
    <Path
      d="M26.93.25H22.61l-3.38 16.3h3.58l.68-3.4h4.08l.38 3.4h3.4L26.93.25zm-2.64 10.3c.48-2.32 1.32-6.52 1.32-6.52l.56 2.86.32 3.66h-2.2zM11.53.25L7.96 11.23l-.3-1.6L5.2 2.65A1.85 1.85 0 003.4.25H.13l-.13 2.1h1.5l2.6 14.2h3.58l5.95-16.3h-1.93z"
      fill="#1A1F71"
    />
    <Path
      d="M37.87.25h-2.4l-2.07 7.9a2.46 2.46 0 01-1.35 1.73l2.84 6.67h3.6l-2.9-6.9a1.59 1.59 0 01-.15-.65l2.53-7.75z"
      fill="#1A1F71"
    />
    <Path
      d="M17.45.25c-1.8 0-3.13.7-4.04 2.1-.85 1.28-1.22 2.9-1.22 4.8s.5 3.6 1.48 4.75c.95 1.12 2.44 1.7 4.14 1.7s3.1-.48 4.1-1.5c.98-1 1.5-2.5 1.5-4.17 0-.3-.02-1.05-.1-1.8H15.9c.07.95.4 1.62 1.02 1.9.7.32 1.48.32 2.1 0 .5-.2.7-.56.7-1.1s-1.8-1.1-1.8-2.65c0-1.7 1.2-2.8 2.83-2.8.6 0 1.1.1 1.4.3.4.2.6.5.7.9h2.2c-.2-2.1-1.6-3.4-3.83-3.4z"
      fill="#F7B600"
    />
  </Svg>
);

const MastercardIcon = () => (
  <Svg width="40" height="24" viewBox="0 0 40 24" fill="none">
    <Path
      d="M15.1 23.5a11.9 11.9 0 100-23.8 11.9 11.9 0 000 23.8z"
      fill="#EB001B"
    />
    <Path
      d="M24.7 23.5a11.9 11.9 0 100-23.8 11.9 11.9 0 000 23.8z"
      fill="#F79E1B"
    />
    <Path
      d="M19.9 15.3c-1.5-1.1-2.4-2.2-2.4-3.2 0-1.2 1-1.8 2.2-1.8 1.5 0 2.3.8 2.3 2h2.5c0-2.8-2-4.4-4.8-4.4s-5 1.7-5 4.5c0 2.5 1.9 3.9 3.2 4.9 1.4 1 2 .9 2 2s-1.1 1.4-2.4 1.4c-1.3 0-2.3-.6-2.3-2h-2.5c0 2.8 2.1 4.2 4.8 4.2s5.1-1.5 5.1-4.5c0-1.7-.8-2.8-3-3.8z"
      fill="#FF5F00"
    />
  </Svg>
);

const getCardIcon = (type: string) => {
  if (!type) return <Ionicons name="card-outline" size={32} />;
  if (type.toLowerCase().includes("visa")) return <VisaIcon />;
  if (type.toLowerCase().includes("mastercard")) return <MastercardIcon />;
  return <Ionicons name="card-outline" size={32} />;
};

export const PaymentMethodCard = ({ method }: { method: PaymentMethod }) => {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { t } = useTranslation();
  const { deletePaymentMethod } = usePaymentMethods();

  const handleDelete = () => {
    Alert.alert(
      t("payment_methods.delete.confirm_title"),
      t("payment_methods.delete.confirm_message"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deletePaymentMethod(method.id);
            } catch {
              Alert.alert(
                t("payment_methods.delete.error_title"),
                t("payment_methods.delete.error_message")
              );
            }
          },
        },
      ]
    );
  };

  return (
    <BaseCard
      style={{
        marginBottom: 16,
        ...(method.isDefault && { borderColor: colors.tint, borderWidth: 1.5 }),
      }}
    >
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-4">
          {getCardIcon(method.type)}
          <View>
            <ThemedText className="text-base font-semibold">
              {method.name}
            </ThemedText>
            <ThemedText className="text-sm mt-0.5 opacity-70">
              {t("payment_methods.card_details", {
                details: method.details,
                expiry: method.expiry,
              })}
            </ThemedText>
          </View>
        </View>
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={handleDelete} hitSlop={10}>
            <Ionicons name="trash-outline" size={22} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {method.isDefault && (
        <View
          className="mt-2 pt-3 border-t"
          style={{ borderTopColor: colors.border }}
        >
          <View className="flex-row items-center gap-2">
            <Ionicons name="star" size={16} color={colors.tint} />
            <ThemedText
              className="text-sm font-semibold"
              style={{ color: colors.tint }}
            >
              {t("payment_methods.default_method")}
            </ThemedText>
          </View>
        </View>
      )}
    </BaseCard>
  );
};

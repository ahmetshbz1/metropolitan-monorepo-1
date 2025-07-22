//  "EmptyPaymentMethods.tsx"
//  metropolitan app
//  Created by Ahmet on 05.07.2025.

import { BaseButton } from "@/components/base/BaseButton";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export const EmptyPaymentMethods = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  return (
    <View className="flex-1 justify-center items-center px-8">
      <Ionicons name="card-outline" size={80} color={colors.mediumGray} />
      <ThemedText type="subtitle" className="mt-5 text-xl font-semibold">
        {t("payment_methods.empty.title")}
      </ThemedText>
      <ThemedText className="mt-2.5 text-center text-sm leading-6">
        {t("payment_methods.empty.subtitle")}
      </ThemedText>
      <BaseButton
        variant="primary"
        size="medium"
        title={t("payment_methods.empty.add_button")}
        hapticType="medium"
        onPress={() => {
          // Checkout payment sayfasına yönlendir (add-payment-method artık yok)
          router.push("/checkout/payment");
        }}
        style={{ marginTop: 24 }}
      />
    </View>
  );
};

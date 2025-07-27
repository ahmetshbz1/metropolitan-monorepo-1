//  "EmptyOrders.tsx"
//  metropolitan app
//  Created by Ahmet on 11.06.2025.

import { BaseButton } from "@/components/base/BaseButton";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export function EmptyOrders() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { t } = useTranslation();

  return (
    <ThemedView className="flex-1 justify-center items-center p-5">
      <Ionicons name="receipt-outline" size={80} color={colors.mediumGray} />
      <ThemedText className="text-lg my-5">
        {t("orders.empty.title")}
      </ThemedText>
      <Link href="/(tabs)" asChild>
        <BaseButton
          variant="primary"
          size="small"
          title={t("orders.empty.button")}
          hapticType="medium"
          style={{ paddingHorizontal: 24, borderRadius: 12 }}
        />
      </Link>
    </ThemedView>
  );
}

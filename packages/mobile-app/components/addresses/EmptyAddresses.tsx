//  "EmptyAddresses.tsx"
//  metropolitan app
//  Created by Ahmet on 02.07.2025.

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { BaseButton } from "@/components/base/BaseButton";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export const EmptyAddresses = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  return (
    <View className="flex-1 justify-center items-center px-8">
      <Ionicons name="map-outline" size={80} color={colors.mediumGray} />
      <ThemedText type="subtitle" className="mt-5 text-xl font-semibold">
        {t("addresses.empty.title")}
      </ThemedText>
      <ThemedText className="mt-2.5 text-center text-base leading-6">
        {t("addresses.empty.subtitle")}
      </ThemedText>
      <BaseButton
        variant="primary"
        size="small"
        title={t("addresses.empty.add_button")}
        hapticType="medium"
        onPress={() => {
          router.push("/add-address");
        }}
        style={{ marginTop: 24 }}
      />
    </View>
  );
};

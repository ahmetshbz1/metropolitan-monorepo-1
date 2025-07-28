//  "AccountSection.tsx"
//  metropolitan app
//  Created by Ahmet on 22.06.2025.

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { HapticButton } from "@/components/HapticButton";
import { ThemedText } from "@/components/ThemedText";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { IoniconsName } from "@/types/ionicons.types";

const actions: {
  icon: IoniconsName;
  labelKey: string;
  route: "/favorites" | "/addresses" | "/notifications";
}[] = [
  {
    icon: "heart-outline",
    labelKey: "profile.favorites",
    route: "/favorites" as const,
  },
  {
    icon: "location-outline",
    labelKey: "profile.addresses",
    route: "/addresses" as const,
  },
  {
    icon: "notifications-outline",
    labelKey: "profile.notifications",
    route: "/notifications" as const,
  },
];

export function AccountSection() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();

  return (
    <View className="w-full">
      <View style={{ marginHorizontal: 16 }}>
        <ThemedText className="text-base font-semibold mb-3">
          {t("profile.account_section_title")}
        </ThemedText>
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 12,
          marginHorizontal: 16,
        }}
      >
        {actions.map((action) => (
          <HapticButton
            key={action.route}
            hapticType="light"
            onPress={() => router.push(action.route)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t(action.labelKey)}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 18,
              backgroundColor: colors.card,
              borderRadius: 18,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Ionicons
              name={action.icon}
              size={28}
              color={colors.tint}
              style={{ marginBottom: 6 }}
            />
            <ThemedText
              className="text-xs font-medium"
              style={{ color: colors.text, textAlign: "center" }}
            >
              {t(action.labelKey)}
            </ThemedText>
          </HapticButton>
        ))}
      </View>
    </View>
  );
}

//  "help-center.tsx"
//  metropolitan app
//  Created by Ahmet on 17.06.2025.

import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import React, { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, TouchableOpacity, View } from "react-native";

import { BaseCard } from "@/components/base/BaseCard";
import { BaseInput } from "@/components/base/BaseInput";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

const CategoryButton = ({ title, icon }: { title: string; icon: any }) => {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <TouchableOpacity activeOpacity={0.85} style={{ borderRadius: 12 }}>
      <BaseCard
        padding={0}
        borderRadius={12}
        margin={0}
        style={{
          minHeight: 52,
          justifyContent: "center",
          backgroundColor: colors.card,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: 12,
            paddingHorizontal: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <Ionicons
              name={icon}
              size={22}
              color={colors.tint}
              style={{ marginRight: 12 }}
            />
            <ThemedText
              style={{ fontSize: 16, fontWeight: "500" }}
              numberOfLines={1}
            >
              {title}
            </ThemedText>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.mediumGray}
            style={{ marginLeft: 12 }}
          />
        </View>
      </BaseCard>
    </TouchableOpacity>
  );
};

export default function HelpCenterScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  // Header title'ı dinamik olarak ayarla
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("help_center.title"),
    });
  }, [navigation, t]);

  const HELP_CATEGORIES = [
    { title: t("help_center.categories.orders"), icon: "cube-outline" },
    { title: t("help_center.categories.returns"), icon: "arrow-undo-outline" },
    {
      title: t("help_center.categories.account"),
      icon: "person-circle-outline",
    },
    { title: t("help_center.categories.payment"), icon: "card-outline" },
    {
      title: t("help_center.categories.security"),
      icon: "shield-checkmark-outline",
    },
  ];

  return (
    <ThemedView className="flex-1">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <ThemedText className="text-2xl font-bold text-center mb-5">
          {t("help_center.header")}
        </ThemedText>
        <View className="flex-row items-center mb-6">
          <Ionicons
            name="search"
            size={20}
            color={colors.mediumGray}
            style={{ position: "absolute", left: 15, zIndex: 1 }}
          />
          <BaseInput
            size="small"
            style={{
              flex: 1,
              height: 44,
              borderRadius: 12,
              paddingLeft: 38,
              paddingRight: 20,
              backgroundColor: colors.lightGray,
              color: colors.text,
              textAlignVertical: "center",
              paddingVertical: 0,
              includeFontPadding: false,
              lineHeight: 18,
            }}
            placeholder={t("help_center.search_placeholder")}
            placeholderTextColor={colors.mediumGray}
          />
        </View>

        <View style={{ gap: 14 }}>
          {HELP_CATEGORIES.map((cat, index) => (
            <CategoryButton key={index} title={cat.title} icon={cat.icon} />
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

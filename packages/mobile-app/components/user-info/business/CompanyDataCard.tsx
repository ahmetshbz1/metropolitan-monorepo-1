//  "CompanyDataCard.tsx"
//  metropolitan app
//  Created by Ahmet on 15.07.2025.
//  Redesigned on 23.09.2025 for minimal professional design

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import type { NipResponse } from "@metropolitan/shared";
import { zincColors } from "@/constants/colors/zincColors";
import { useColorScheme } from "@/hooks/useColorScheme";

interface CompanyDataCardProps {
  companyData: NipResponse;
  canRegister: boolean;
  themeColors: any;
  t: (key: string) => string;
}

export function CompanyDataCard({
  companyData,
  canRegister,
  themeColors,
  t,
}: CompanyDataCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  return (
    <View
      className="mt-3 p-4 rounded-xl border"
      style={{
        backgroundColor: isDark ? zincColors[900] : zincColors[50],
        borderColor: isDark ? zincColors[800] : zincColors[200],
      }}
    >
      {/* Company name and status */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1">
          <Text
            className="text-base font-semibold"
            style={{ color: themeColors.text }}
            numberOfLines={2}
          >
            {companyData.companyName}
          </Text>
          <Text
            className="text-sm mt-0.5"
            style={{ color: themeColors.mediumGray, opacity: 0.8 }}
          >
            NIP: {companyData.nip}
          </Text>
        </View>
        <View
          className="px-2.5 py-1 rounded-md"
          style={{
            backgroundColor:
              companyData.statusVat === "Czynny"
                ? isDark ? "#10B98120" : "#10B98115"
                : isDark ? "#EF444420" : "#EF444415",
          }}
        >
          <Text
            className="text-xs font-medium"
            style={{
              color: companyData.statusVat === "Czynny" ? "#10B981" : "#EF4444",
            }}
          >
            {companyData.statusVat === "Czynny" ? "AKTİF" : "PASİF"}
          </Text>
        </View>
      </View>

      {/* Verification status */}
      <View className="flex-row items-center">
        <Ionicons
          name={canRegister ? "checkmark-circle" : "information-circle"}
          size={16}
          color={canRegister ? "#10B981" : themeColors.mediumGray}
        />
        <Text
          className="text-sm ml-2"
          style={{
            color: canRegister ? "#10B981" : themeColors.mediumGray,
            opacity: 0.9
          }}
        >
          {canRegister
            ? t("user_info.nip_verified_success")
            : t("user_info.nip_verified_warning")}
        </Text>
      </View>
    </View>
  );
}
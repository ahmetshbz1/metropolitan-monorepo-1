//  "CompanyDataCard.tsx"
//  metropolitan app
//  Created by Ahmet on 15.07.2025.
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableWithoutFeedback, View } from "react-native";
import type { NipResponse } from "@metropolitan/shared";

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
  return (
    <TouchableWithoutFeedback>
      <View
        className="mt-4 p-5 rounded-xl border"
        style={{
          backgroundColor: `${themeColors.tint}08`,
          borderColor: `${themeColors.tint}30`,
        }}
      >
        {/* Header with company name and status */}
        <View className="flex-row items-start justify-between mb-4">
          <View className="flex-1 mr-3">
            <Text
              className="text-sm font-medium mb-1 opacity-70"
              style={{ color: themeColors.text }}
              selectable={false}
            >
              {t("user_info.company_name_label") || "Şirket Adı"}
            </Text>
            <Text
              className="text-lg font-bold leading-6"
              style={{ color: themeColors.tint }}
              selectable={false}
            >
              {companyData.companyName}
            </Text>
          </View>
          <View
            className="px-3 py-1.5 rounded-full"
            style={{
              backgroundColor:
                companyData.statusVat === "Czynny" ? "#10B981" : "#EF4444",
            }}
          >
            <Text
              className="text-white text-xs font-semibold"
              selectable={false}
            >
              {companyData.statusVat === "Czynny" ? "AKTİF" : "PASİF"}
            </Text>
          </View>
        </View>

        {/* Company details grid */}
        <View className="space-y-3">
          {/* NIP & REGON Row */}
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text
                className="text-xs font-medium opacity-60 mb-1"
                style={{ color: themeColors.text }}
                selectable={false}
              >
                NIP
              </Text>
              <Text
                className="text-sm font-semibold"
                style={{ color: themeColors.text }}
                selectable={false}
              >
                {companyData.nip}
              </Text>
            </View>
            <View className="flex-1">
              <Text
                className="text-xs font-medium opacity-60 mb-1"
                style={{ color: themeColors.text }}
                selectable={false}
              >
                REGON
              </Text>
              <Text
                className="text-sm font-semibold"
                style={{ color: themeColors.text }}
                selectable={false}
              >
                {companyData.regon}
              </Text>
            </View>
          </View>

          {/* KRS & Registration Date Row */}
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text
                className="text-xs font-medium opacity-60 mb-1"
                style={{ color: themeColors.text }}
                selectable={false}
              >
                KRS
              </Text>
              <Text
                className="text-sm font-semibold"
                style={{ color: themeColors.text }}
                selectable={false}
              >
                {companyData.krs}
              </Text>
            </View>
            <View className="flex-1">
              <Text
                className="text-xs font-medium opacity-60 mb-1"
                style={{ color: themeColors.text }}
                selectable={false}
              >
                {t("user_info.registration_date_label") || "Kayıt Tarihi"}
              </Text>
              <Text
                className="text-sm font-semibold"
                style={{ color: themeColors.text }}
                selectable={false}
              >
                {new Date(companyData.registrationDate).toLocaleDateString(
                  "tr-TR"
                )}
              </Text>
            </View>
          </View>

          {/* Address */}
          <View className="mt-1">
            <Text
              className="text-xs font-medium opacity-60 mb-1"
              style={{ color: themeColors.text }}
              selectable={false}
            >
              {t("user_info.company_address_label") || "Şirket Adresi"}
            </Text>
            <Text
              className="text-sm font-medium leading-5"
              style={{ color: themeColors.text }}
              selectable={false}
            >
              {companyData.workingAddress}
            </Text>
          </View>
        </View>

        {/* Success/Warning indicator */}
        <View
          className="flex-row items-center justify-center mt-4 pt-3 border-t"
          style={{ borderTopColor: `${themeColors.tint}20` }}
        >
          <Ionicons
            name={canRegister ? "checkmark-circle" : "warning"}
            size={16}
            color={canRegister ? themeColors.tint : "#FFA500"}
          />
          <Text
            className="text-sm font-medium ml-2"
            style={{ color: canRegister ? themeColors.tint : "#FFA500" }}
            selectable={false}
          >
            {canRegister
              ? t("user_info.nip_verified_success")
              : t("user_info.nip_verified_warning")}
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

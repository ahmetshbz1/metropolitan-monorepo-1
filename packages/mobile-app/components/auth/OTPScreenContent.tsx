//  "OTPScreenContent.tsx"
//  metropolitan app
//  Created by Ahmet on 21.06.2025.

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";

import { AuthHeader } from "./AuthHeader";
import { OTPInput } from "./OTPInput";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export interface OTPScreenContentProps {
  phone?: string;
  code: string;
  setCode: (code: string) => void;
  handleVerifyCode: () => void;
  handleResendCode: () => void;
  loading: boolean;
  resendTimer: number;
  error: boolean;
  errorMessage?: string;
}

export const OTPScreenContent: React.FC<OTPScreenContentProps> = ({
  phone,
  code,
  setCode,
  handleVerifyCode,
  handleResendCode,
  loading,
  resendTimer,
  error,
  errorMessage,
}) => {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  return (
    <>
      <AuthHeader
        title={t("otp.title")}
        subtitle={`${t("otp.subtitle_part1")} ${phone} ${t("otp.subtitle_part2")}`}
        style={{ paddingVertical: 16 }}
      />

      <View className="flex-1 justify-center px-6 pt-4">
        <OTPInput
          code={code}
          setCode={setCode}
          onSubmit={handleVerifyCode}
          isError={error}
        />

        {error && errorMessage && (
          <View className="mt-3 flex-row items-center rounded-lg bg-red-500/10 p-3">
            <Ionicons
              name="close-circle"
              size={16}
              color={themeColors.danger}
            />
            <Text
              className="ml-2 text-sm"
              style={{ color: themeColors.danger }}
            >
              {errorMessage}
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleResendCode}
          disabled={resendTimer > 0}
          className="mt-6 self-center"
        >
          <Text
            className="text-base"
            style={{
              color:
                resendTimer > 0 ? themeColors.mediumGray : themeColors.tint,
              opacity: resendTimer > 0 ? 0.6 : 1,
            }}
          >
            {resendTimer > 0
              ? `${t("otp.resend_code_in")} ${resendTimer}s`
              : t("otp.resend_code")}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

// "delete-account.tsx"
// metropolitan app
// Account deletion with OTP verification

import { BaseButton } from "@/components/base/BaseButton";
import { BaseInput } from "@/components/base/BaseInput";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { api } from "@/core/api";
import { API_ENDPOINTS } from "@metropolitan/shared";
import { router } from "expo-router";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Text, View } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const DeleteAccountScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  // Header title'ı dinamik olarak ayarla
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("delete_account.title"),
    });
  }, [navigation, t]);

  // Resend timer effect
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      setError(t("delete_account.phone_required"));
      return;
    }

    // Telefon numarası kontrolü
    if (user?.phoneNumber && phoneNumber !== user.phoneNumber) {
      setError(t("delete_account.phone_mismatch"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/account/delete/send-otp", {
        phoneNumber,
      });

      if (response.data.success) {
        setStep("otp");
        setResendTimer(60);
      } else {
        setError(response.data.message || t("delete_account.otp_send_error"));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t("delete_account.otp_send_error"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      setError(t("delete_account.otp_invalid_length"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/account/delete/verify-otp", {
        phoneNumber,
        otpCode,
      });

      if (response.data.success) {
        Alert.alert(
          t("delete_account.success_title"),
          t("delete_account.success_message"),
          [
            {
              text: t("common.ok"),
              onPress: async () => {
                await logout();
                router.replace("/(auth)/login");
              },
            },
          ]
        );
      } else {
        setError(response.data.message || t("delete_account.verify_error"));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t("delete_account.verify_error"));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/account/delete/send-otp", {
        phoneNumber,
      });

      if (response.data.success) {
        setResendTimer(60);
      } else {
        setError(response.data.message || t("delete_account.otp_send_error"));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t("delete_account.otp_send_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView className="flex-1">
      <KeyboardAwareScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
        }}
        keyboardShouldPersistTaps="always"
      >
        <View className="flex-1 pt-8">
          {/* Warning Icon and Message */}
          <View className="items-center mb-6">
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={64}
              color={themeColors.error}
            />
            <ThemedText className="text-lg font-semibold mt-4 text-center">
              {t("delete_account.warning_title")}
            </ThemedText>
            <ThemedText className="text-sm text-center mt-2 px-4 opacity-70">
              {t("delete_account.warning_message")}
            </ThemedText>
          </View>

          {/* Phone Input Step */}
          {step === "phone" && (
            <View className="space-y-4">
              <ThemedText className="text-base mb-2">
                {t("delete_account.phone_label")}
              </ThemedText>
              <BaseInput
                label=""
                placeholder={t("delete_account.phone_placeholder")}
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  setError("");
                }}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                editable={!loading}
              />
              <ThemedText className="text-sm opacity-70">
                {t("delete_account.phone_hint")}
              </ThemedText>
            </View>
          )}

          {/* OTP Input Step */}
          {step === "otp" && (
            <View className="space-y-4">
              <ThemedText className="text-base mb-2">
                {t("delete_account.otp_label", { phone: phoneNumber })}
              </ThemedText>
              <BaseInput
                label=""
                placeholder="000000"
                value={otpCode}
                onChangeText={(text) => {
                  setOtpCode(text.replace(/[^0-9]/g, "").slice(0, 6));
                  setError("");
                }}
                keyboardType="number-pad"
                autoComplete="sms-otp"
                textContentType="oneTimeCode"
                maxLength={6}
                editable={!loading}
              />

              {/* Resend OTP Button */}
              <View className="flex-row justify-center">
                <BaseButton
                  variant="text"
                  size="small"
                  title={
                    resendTimer > 0
                      ? t("delete_account.resend_timer", { seconds: resendTimer })
                      : t("delete_account.resend_otp")
                  }
                  onPress={handleResendOTP}
                  disabled={resendTimer > 0 || loading}
                />
              </View>
            </View>
          )}

          {/* Error Message */}
          {error ? (
            <View className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <ThemedText className="text-sm text-red-600 dark:text-red-400">
                {error}
              </ThemedText>
            </View>
          ) : null}

          {/* Info Messages */}
          <View className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <ThemedText className="text-sm font-medium mb-2">
              {t("delete_account.info_title")}
            </ThemedText>
            <ThemedText className="text-xs opacity-70">
              • {t("delete_account.info_1")}
            </ThemedText>
            <ThemedText className="text-xs opacity-70 mt-1">
              • {t("delete_account.info_2")}
            </ThemedText>
            <ThemedText className="text-xs opacity-70 mt-1">
              • {t("delete_account.info_3")}
            </ThemedText>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Bottom Button */}
      <KeyboardStickyView>
        <View
          className="px-6 py-4"
          style={{
            paddingBottom: insets.bottom || 16,
            backgroundColor: themeColors.background,
          }}
        >
          {step === "phone" ? (
            <BaseButton
              variant="danger"
              size="small"
              title={t("delete_account.send_otp_button")}
              loading={loading}
              disabled={!phoneNumber.trim()}
              onPress={handleSendOTP}
              fullWidth
            />
          ) : (
            <BaseButton
              variant="danger"
              size="small"
              title={t("delete_account.delete_button")}
              loading={loading}
              disabled={otpCode.length !== 6}
              onPress={handleVerifyOTP}
              fullWidth
            />
          )}
        </View>
      </KeyboardStickyView>
    </ThemedView>
  );
};

export default DeleteAccountScreen;
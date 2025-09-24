// "delete-account.tsx"
// metropolitan app
// Account deletion with OTP verification

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { OTPInput } from "@/components/auth/OTPInput";
import { PhoneInput } from "@/components/auth/PhoneInput";
import { BaseButton } from "@/components/base/BaseButton";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/core/api";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useToast } from "@/hooks/useToast";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DeleteAccountScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("48");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  // Telefon numarası parsing fonksiyonları
  const parsePhoneNumber = (input: string) => {
    // Sadece sayıları al
    const cleaned = input.replace(/[^\d+]/g, "");

    // Eğer + ile başlıyorsa ve uzunsa, tam numara olarak kabul et
    if (cleaned.startsWith("+") && cleaned.length > 10) {
      // +48600790035 gibi tam numara
      const withoutPlus = cleaned.substring(1);

      // Bilinen ülke kodlarını kontrol et
      if (withoutPlus.startsWith("48")) {
        return {
          countryCode: "48",
          phoneNumber: withoutPlus.substring(2),
        };
      }
      if (withoutPlus.startsWith("90")) {
        return {
          countryCode: "90",
          phoneNumber: withoutPlus.substring(2),
        };
      }
      if (withoutPlus.startsWith("49")) {
        return {
          countryCode: "49",
          phoneNumber: withoutPlus.substring(2),
        };
      }
      // Diğer ülke kodları eklenebilir

      // Bilinmeyen format, varsayılan olarak 48 kullan
      return {
        countryCode: "48",
        phoneNumber: withoutPlus,
      };
    }

    // + olmadan ama uzun numara (48600790035 gibi)
    if (cleaned.length > 9) {
      if (cleaned.startsWith("48")) {
        return {
          countryCode: "48",
          phoneNumber: cleaned.substring(2),
        };
      }
      if (cleaned.startsWith("90")) {
        return {
          countryCode: "90",
          phoneNumber: cleaned.substring(2),
        };
      }
      if (cleaned.startsWith("49")) {
        return {
          countryCode: "49",
          phoneNumber: cleaned.substring(2),
        };
      }
    }

    // Kısa numara, sadece telefon numarası olarak kabul et
    return {
      countryCode: countryCode, // Mevcut alan kodunu koru
      phoneNumber: cleaned.replace(/^\+/, ""), // + varsa kaldır
    };
  };

  // Header title'ı dinamik olarak ayarla
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("delete_account.title"),
    });
  }, [navigation, t]);

  // Kullanıcının mevcut telefon numarasını otomatik doldur
  React.useEffect(() => {
    if (user?.phoneNumber) {
      const parsed = parsePhoneNumber(user.phoneNumber);
      setCountryCode(parsed.countryCode);
      setPhoneNumber(parsed.phoneNumber);
    }
  }, [user?.phoneNumber]);

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

    const fullPhoneNumber = `+${countryCode}${phoneNumber}`;

    // Telefon numarası kontrolü - güvenlik için normalize edilmiş karşılaştırma
    const normalizePhone = (phone: string) => phone.replace(/[\s\-\(\)]/g, '');
    if (user?.phoneNumber && normalizePhone(fullPhoneNumber) !== normalizePhone(user.phoneNumber)) {
      setError(t("delete_account.phone_mismatch"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/account/delete/send-otp", {
        phoneNumber: fullPhoneNumber,
      });

      if (response.data.success) {
        setStep("otp");
        setResendTimer(60);
      } else {
        setError(response.data.message || t("delete_account.otp_send_error"));
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || t("delete_account.otp_send_error")
      );
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
      const fullPhoneNumber = `+${countryCode}${phoneNumber}`;
      const response = await api.post("/auth/account/delete/verify-otp", {
        phoneNumber: fullPhoneNumber,
        otpCode,
      });

      if (response.data.success) {
        // Başarı toast'ı göster
        showToast(t("delete_account.success_message"), "success", 4000);

        // 2 saniye bekle sonra logout yap ve login sayfasına yönlendir
        setTimeout(async () => {
          await logout();
          router.replace("/(auth)/phone-login");
        }, 2000);
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
      const fullPhoneNumber = `+${countryCode}${phoneNumber}`;
      const response = await api.post("/auth/account/delete/send-otp", {
        phoneNumber: fullPhoneNumber,
      });

      if (response.data.success) {
        setResendTimer(60);
      } else {
        setError(response.data.message || t("delete_account.otp_send_error"));
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || t("delete_account.otp_send_error")
      );
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
          {/* Warning Section */}
          <View className="mb-8">
            <View className="flex-row items-center mb-4">
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={24}
                color={themeColors.error}
                style={{ marginRight: 12 }}
              />
              <ThemedText
                className="text-lg font-semibold"
                style={{ color: themeColors.error }}
              >
                {t("delete_account.warning_title")}
              </ThemedText>
            </View>

            <ThemedText className="text-sm opacity-70 mb-6 leading-6">
              {t("delete_account.warning_message")}
            </ThemedText>
          </View>

          {/* Phone Input Step */}
          {step === "phone" && (
            <View className="space-y-4">
              <PhoneInput
                phoneNumber={phoneNumber}
                countryCode={countryCode}
                onPhoneNumberChange={(text) => {
                  // Akıllı parsing uygula
                  const parsed = parsePhoneNumber(text);
                  setCountryCode(parsed.countryCode);
                  setPhoneNumber(parsed.phoneNumber);
                  setError("");
                }}
                onCountryCodeChange={setCountryCode}
                onCountryCodeFocus={() => {}}
                onCountryCodeBlur={() => {}}
              />
              {error ? (
                <ThemedText
                  className="text-xs mt-2"
                  style={{ color: themeColors.error }}
                >
                  {error}
                </ThemedText>
              ) : null}
              <ThemedText className="text-xs opacity-70 mt-2">
                {t("delete_account.phone_hint")}
              </ThemedText>
            </View>
          )}

          {/* OTP Input Step */}
          {step === "otp" && (
            <View className="space-y-4">
              <ThemedText className="text-base mb-4 text-center">
                {t("delete_account.otp_label", {
                  phone: `+${countryCode}${phoneNumber}`,
                })}
              </ThemedText>

              <View className="items-center mb-6">
                <OTPInput
                  code={otpCode}
                  setCode={(text) => {
                    setOtpCode(text);
                    setError("");
                  }}
                  onSubmit={handleVerifyOTP}
                  isError={!!error}
                />
              </View>

              {error ? (
                <ThemedText
                  className="text-xs text-center mt-2"
                  style={{ color: themeColors.error }}
                >
                  {error}
                </ThemedText>
              ) : null}

              {/* Resend OTP Button */}
              <View className="flex-row justify-center">
                <BaseButton
                  variant="text"
                  size="small"
                  title={
                    resendTimer > 0
                      ? t("delete_account.resend_timer", {
                          seconds: resendTimer,
                        })
                      : t("delete_account.resend_otp")
                  }
                  onPress={handleResendOTP}
                  disabled={resendTimer > 0 || loading}
                />
              </View>
            </View>
          )}
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

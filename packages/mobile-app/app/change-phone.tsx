// "change-phone.tsx"
// metropolitan app
// Change phone number page with multi-step verification

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
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Step = "verify_current" | "enter_new" | "verify_new";

export default function ChangePhoneScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { user, refreshUserProfile } = useAuth();

  const [step, setStep] = useState<Step>("verify_current");
  const [currentPhone, setCurrentPhone] = useState("");
  const [currentCountryCode, setCurrentCountryCode] = useState("48");
  const [newPhone, setNewPhone] = useState("");
  const [newCountryCode, setNewCountryCode] = useState("48");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [countryCodeSelection, setCountryCodeSelection] = useState({
    start: 0,
    end: 0,
  });

  // OTP için session ID'leri
  const [currentPhoneSessionId, setCurrentPhoneSessionId] = useState("");
  const [newPhoneSessionId, setNewPhoneSessionId] = useState("");

  const timerRef = useRef<NodeJS.Timeout>();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("change_phone.title"),
    });
  }, [navigation, t]);

  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resendTimer]);

  // Mevcut telefon numarasını doğrula
  const verifyCurrentPhone = async () => {
    if (!currentPhone || currentPhone.replace(/\s/g, "").length < 7) {
      showToast(t("change_phone.invalid_phone"), "error");
      return;
    }

    // Tam telefon numarasını oluştur
    const fullCurrentPhone = `+${currentCountryCode}${currentPhone.replace(/\s/g, "")}`;
    const formattedCurrent = fullCurrentPhone.replace(/[^0-9+]/g, "");
    const userPhone = user?.phone?.replace(/[^0-9+]/g, "");

    if (formattedCurrent !== userPhone) {
      showToast(t("change_phone.phone_mismatch"), "error");
      return;
    }

    setLoading(true);
    try {
      // Mevcut numaraya OTP gönder
      const response = await api.post("/auth/change-phone/verify-current", {
        currentPhone: formattedCurrent,
      });

      if (response.data.success) {
        setCurrentPhoneSessionId(response.data.sessionId);
        setStep("enter_new");
        showToast(t("change_phone.current_verified"), "success");
      }
    } catch (error: any) {
      showToast(
        error.response?.data?.message || t("change_phone.verify_error"),
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Yeni telefon numarası için OTP gönder
  const sendOtpToNewPhone = async () => {
    if (!newPhone || newPhone.replace(/\s/g, "").length < 7) {
      showToast(t("change_phone.invalid_phone"), "error");
      return;
    }

    const fullNewPhone = `+${newCountryCode}${newPhone.replace(/\s/g, "")}`;
    const formattedNew = fullNewPhone.replace(/[^0-9+]/g, "");
    const userPhone = user?.phone?.replace(/[^0-9+]/g, "");

    if (formattedNew === userPhone) {
      showToast(t("change_phone.same_as_current"), "error");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/change-phone/send-otp", {
        sessionId: currentPhoneSessionId,
        newPhone: formattedNew,
      });

      if (response.data.success) {
        setNewPhoneSessionId(response.data.sessionId);
        setStep("verify_new");
        setResendTimer(60);
        showToast(t("change_phone.otp_sent"), "success");
      }
    } catch (error: any) {
      showToast(
        error.response?.data?.message || t("change_phone.send_error"),
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Yeni telefon numarasını doğrula ve değişikliği tamamla
  const verifyNewPhone = async () => {
    if (otp.length !== 6) {
      showToast(t("change_phone.invalid_otp"), "error");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/change-phone/verify-new", {
        currentSessionId: currentPhoneSessionId,
        newSessionId: newPhoneSessionId,
        otp,
      });

      if (response.data.success) {
        showToast(t("change_phone.success"), "success");
        // Kullanıcı bilgilerini güncelle
        await refreshUserProfile();
        router.back();
      }
    } catch (error: any) {
      showToast(
        error.response?.data?.message || t("change_phone.verify_error"),
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // OTP'yi yeniden gönder
  const resendOtp = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    try {
      const fullNewPhone = `+${newCountryCode}${newPhone.replace(/\s/g, "")}`;
      const response = await api.post("/auth/change-phone/resend-otp", {
        sessionId: newPhoneSessionId,
        phone: fullNewPhone,
      });

      if (response.data.success) {
        setResendTimer(60);
        showToast(t("change_phone.otp_resent"), "success");
      }
    } catch (error: any) {
      showToast(t("change_phone.resend_error"), "error");
    } finally {
      setLoading(false);
    }
  };

  const getStepButton = () => {
    switch (step) {
      case "verify_current":
        return (
          <BaseButton
            variant="primary"
            size="small"
            title={t("change_phone.verify_button")}
            onPress={verifyCurrentPhone}
            loading={loading}
            disabled={!currentPhone}
            fullWidth
          />
        );
      case "enter_new":
        return (
          <BaseButton
            variant="primary"
            size="small"
            title={t("change_phone.send_otp_button")}
            onPress={sendOtpToNewPhone}
            loading={loading}
            disabled={!newPhone}
            fullWidth
          />
        );
      case "verify_new":
        return (
          <BaseButton
            variant="primary"
            size="small"
            title={t("change_phone.complete_button")}
            onPress={verifyNewPhone}
            loading={loading}
            disabled={otp.length !== 6}
            fullWidth
          />
        );
    }
  };

  const renderStep = () => {
    switch (step) {
      case "verify_current":
        return (
          <>
            {/* Info Card */}
            <View
              style={{
                padding: 16,
                backgroundColor: colors.primary + "10",
                borderRadius: 12,
                marginBottom: 24,
              }}
            >
              <View className="flex-row items-start">
                <Ionicons
                  name="information-circle-outline"
                  size={24}
                  color={colors.primary}
                  style={{ marginRight: 12, marginTop: 2 }}
                />
                <View className="flex-1">
                  <ThemedText className="text-sm font-medium mb-2">
                    {t("change_phone.verify_current_title")}
                  </ThemedText>
                  <ThemedText className="text-xs opacity-80">
                    {t("change_phone.verify_current_desc")}
                  </ThemedText>
                </View>
              </View>
            </View>

            <View>
              <PhoneInput
                phoneNumber={currentPhone}
                countryCode={currentCountryCode}
                countryCodeSelection={countryCodeSelection}
                onPhoneNumberChange={setCurrentPhone}
                onCountryCodeChange={setCurrentCountryCode}
                onCountryCodeFocus={() =>
                  setCountryCodeSelection({
                    start: 0,
                    end: currentCountryCode.length,
                  })
                }
                onCountryCodeBlur={() =>
                  setCountryCodeSelection({ start: 0, end: 0 })
                }
              />
              <ThemedText className="text-xs opacity-60 mt-2">
                {t("change_phone.current_phone_hint")}
              </ThemedText>
            </View>
          </>
        );

      case "enter_new":
        return (
          <>
            {/* Success Step 1 */}
            <View
              style={{
                padding: 12,
                backgroundColor: colors.success + "10",
                borderRadius: 8,
                marginBottom: 24,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.success}
                style={{ marginRight: 8 }}
              />
              <ThemedText className="text-sm flex-1">
                {t("change_phone.step1_complete")}
              </ThemedText>
            </View>

            <View>
              <PhoneInput
                phoneNumber={newPhone}
                countryCode={newCountryCode}
                countryCodeSelection={countryCodeSelection}
                onPhoneNumberChange={setNewPhone}
                onCountryCodeChange={setNewCountryCode}
                onCountryCodeFocus={() =>
                  setCountryCodeSelection({
                    start: 0,
                    end: newCountryCode.length,
                  })
                }
                onCountryCodeBlur={() =>
                  setCountryCodeSelection({ start: 0, end: 0 })
                }
              />
              <ThemedText className="text-xs opacity-60 mt-2">
                {t("change_phone.new_phone_hint")}
              </ThemedText>
            </View>
          </>
        );

      case "verify_new":
        return (
          <>
            <View className="items-center mb-6">
              <Ionicons
                name="chatbox-ellipses-outline"
                size={64}
                color={colors.primary}
              />
              <ThemedText className="text-lg font-semibold mt-4 text-center">
                {t("change_phone.verify_new_title")}
              </ThemedText>
              <ThemedText className="text-sm opacity-70 mt-2 text-center">
                {t("change_phone.verify_new_desc", {
                  phone: newPhone,
                })}
              </ThemedText>
            </View>

            <View>
              <ThemedText className="text-sm mb-4 text-center font-medium opacity-80">
                {t("change_phone.otp_label")}
              </ThemedText>

              <View className="items-center mb-6">
                <OTPInput
                  code={otp}
                  setCode={setOtp}
                  onSubmit={() => {
                    if (otp.length === 6) {
                      // OTP doğrulama fonksiyonunu çağır
                      verifyNewPhone();
                    }
                  }}
                  isError={false}
                />
              </View>
            </View>

            {/* Resend OTP Button */}
            <View className="flex-row justify-center">
              <BaseButton
                variant="text"
                size="small"
                title={
                  resendTimer > 0
                    ? t("change_phone.resend_timer", { seconds: resendTimer })
                    : t("change_phone.resend_otp")
                }
                onPress={resendOtp}
                disabled={resendTimer > 0 || loading}
              />
            </View>
          </>
        );
    }
  };

  return (
    <ThemedView className="flex-1">
      {/* Progress Indicator */}
      <View className="flex-row justify-center px-5 pt-5 pb-3">
        {["verify_current", "enter_new", "verify_new"].map((s, index) => (
          <React.Fragment key={s}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor:
                  step === s
                    ? colors.primary
                    : index <
                        ["verify_current", "enter_new", "verify_new"].indexOf(
                          step
                        )
                      ? colors.success
                      : colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {index <
              ["verify_current", "enter_new", "verify_new"].indexOf(step) ? (
                <Ionicons name="checkmark" size={16} color="white" />
              ) : (
                <ThemedText
                  style={{
                    color: step === s ? "white" : colors.mediumGray,
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  {index + 1}
                </ThemedText>
              )}
            </View>
            {index < 2 && (
              <View
                style={{
                  flex: 1,
                  height: 2,
                  backgroundColor:
                    index <
                    ["verify_current", "enter_new", "verify_new"].indexOf(step)
                      ? colors.success
                      : colors.border,
                  alignSelf: "center",
                  marginHorizontal: 8,
                }}
              />
            )}
          </React.Fragment>
        ))}
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        disableScrollOnKeyboardHide
        enableAutomaticScroll={false}
      >
        <View className="flex-1 justify-center">{renderStep()}</View>
      </KeyboardAwareScrollView>

      <KeyboardStickyView>
        <View
          className="px-5 py-4"
          style={{
            backgroundColor: colors.background,
            paddingBottom: insets.bottom || 20,
          }}
        >
          {getStepButton()}
        </View>
      </KeyboardStickyView>
    </ThemedView>
  );
}

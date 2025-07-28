//  "index.tsx"
//  metropolitan app
//  Created by Ahmet on 04.06.2025.

import { AuthHeaderImage } from "@/components/auth/AuthHeaderImage";
import { LoginTypeSelector } from "@/components/auth/LoginTypeSelector";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { BaseButton } from "@/components/base/BaseButton";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useHaptics } from "@/hooks/useHaptics";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View, useColorScheme, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LoginScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { from } = useLocalSearchParams();
  const { loginAsGuest } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { withHapticFeedback } = useHaptics();
  const [loginType, setLoginType] = useState<"b2b" | "b2c">("b2c");
  const [socialSectionHeight, setSocialSectionHeight] = useState<number>(0);

  const handleGuestLogin = async () => {
    await loginAsGuest();
    router.replace("/(tabs)");
  };

  // Ekran genişliğine orantılı başlık boyutu (min 22, max 30)
  const { width: winWidth } = useWindowDimensions();
  const titleFontSize = Math.max(24, Math.min(34, winWidth * 0.07));
  const subtitleFontSize = titleFontSize * 0.55; // Alt başlık orantılı

  // Checkout'tan gelme durumu
  const isFromCheckout = from === "checkout";

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: themeColors.background }}
    >
      <AuthHeaderImage />

      <View className="flex-1 justify-between px-6 pt-4">
        <View>
          <Text
            className="font-bold text-center mb-2"
            style={{ color: themeColors.text, fontSize: titleFontSize }}
          >
            {isFromCheckout
              ? t("login.checkout_title")
              : t("login.welcome_title")}
          </Text>
          <Text
            className="text-base text-center self-center"
            style={{
              color: themeColors.mediumGray,
              maxWidth: "90%",
              fontSize: subtitleFontSize,
            }}
          >
            {isFromCheckout
              ? t("login.checkout_subtitle")
              : t("login.welcome_subtitle")}
          </Text>

          <LoginTypeSelector
            loginType={loginType}
            onLoginTypeChange={setLoginType}
            themeColors={themeColors}
          />
        </View>

        <View
          className="items-center"
          style={{ paddingBottom: insets.bottom || 20 }}
        >
          <BaseButton
            variant="primary"
            size="small"
            fullWidth
            onPress={withHapticFeedback(
              () =>
                router.push({
                  pathname: "/(auth)/phone-login",
                  params: { type: loginType },
                }),
              "light"
            )}
            style={{ marginBottom: 20 }}
          >
            <View className="flex-row items-center">
              <Ionicons name="call-outline" size={22} color="white" />
              <Text className="text-white text-lg font-semibold ml-2">
                {t("login.phone_button")}
              </Text>
            </View>
          </BaseButton>

          {loginType === "b2c" ? (
            <SocialLoginButtons
              themeColors={themeColors}
              colorScheme={colorScheme}
              onLayout={setSocialSectionHeight}
            />
          ) : (
            // B2B modunda sosyal medya bölümü yerine bilgilendirici metin göster
            <View
              style={{
                justifyContent: "center",
                alignItems: "center",
                ...(socialSectionHeight
                  ? { height: socialSectionHeight }
                  : { paddingVertical: 24 }),
              }}
            >
              <Text
                className="text-sm text-center"
                style={{
                  color: themeColors.mediumGray,
                  maxWidth: "80%",
                  fontSize: subtitleFontSize,
                }}
              >
                {t("login.b2b_note")}
              </Text>
            </View>
          )}

          <BaseButton
            variant="text"
            size="small"
            title={t("login.guest_button")}
            onPress={withHapticFeedback(handleGuestLogin, "light")}
            style={{ marginTop: 24 }}
          />
        </View>
      </View>
    </View>
  );
};

export default LoginScreen;

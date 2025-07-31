//  "otp.tsx"
//  metropolitan app
//  Created by Ahmet on 04.07.2025.

import { OTPScreenContent } from "@/components/auth/OTPScreenContent";
import { BaseButton } from "@/components/base/BaseButton";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useOTP } from "@/hooks/useOTP";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const OTPScreen = () => {
  const router = useRouter();
  const { phone, type } = useLocalSearchParams<{
    phone: string;
    type?: string;
  }>();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  const handleSuccess = (isNewUser: boolean) => {
    if (isNewUser) {
      router.replace({
        pathname: "/(auth)/user-info",
        params: { phone, type },
      });
    } else {
      router.replace("/");
    }
  };

  const otp = useOTP({ onSuccess: handleSuccess });

  useEffect(() => {
    setIsButtonDisabled(otp.code.length !== 6);
  }, [otp.code]);

  return (
    <ThemedView className="flex-1">
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="always"
        disableScrollOnKeyboardHide
        // @ts-ignore
        enableAutomaticScroll={false}
        scrollEnabled={false}
      >
        <OTPScreenContent
          phone={phone}
          code={otp.code}
          setCode={(text) => {
            otp.setCode(text);
            otp.clearError();
          }}
          handleVerifyCode={otp.handleVerifyCode}
          handleResendCode={otp.handleResendCode}
          resendTimer={otp.resendTimer}
          loading={otp.loading}
          error={otp.error}
          errorMessage={otp.errorMessage}
        />
      </KeyboardAwareScrollView>
      <KeyboardStickyView>
        <View
          className="px-6 py-4"
          style={{
            paddingBottom: insets.bottom || 16,
            backgroundColor: themeColors.background,
          }}
        >
          <BaseButton
            variant="primary"
            size="small"
            title={t("otp.verify_button")}
            loading={otp.loading}
            disabled={isButtonDisabled}
            onPress={otp.handleVerifyCode}
            fullWidth
          />
        </View>
      </KeyboardStickyView>
    </ThemedView>
  );
};

export default OTPScreen;

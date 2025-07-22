//  "phone-login.tsx"
//  metropolitan app
//  Created by Ahmet on 12.06.2025.

import { useFocusEffect } from "expo-router";
import React from "react";
import { TextInput, View } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";

import { AuthHeader } from "@/components/auth/AuthHeader";
import { PhoneInput } from "@/components/auth/PhoneInput";
import { SendCodeButton } from "@/components/auth/SendCodeButton";
import { ThemedView } from "@/components/ThemedView";
import { usePhoneLogin } from "@/hooks/usePhoneLogin";
import { useToast } from "@/hooks/useToast";
import {
  PHONE_LOGIN_LAYOUT,
  usePhoneLoginStyles,
} from "@/utils/phoneLoginStyles";

const PhoneLoginScreen = () => {
  const {
    phoneNumber,
    countryCode,
    loading,
    countryCodeSelection,
    isButtonDisabled,
    handlePhoneInputChange,
    handleCountryCodeChange,
    handleCountryCodeFocus,
    handleCountryCodeBlur,
    handleSendCode,
    t,
  } = usePhoneLogin();

  const { stickyViewStyle } = usePhoneLoginStyles();
  const { showToast } = useToast();
  const phoneInputRef = React.useRef<TextInput>(null);

  useFocusEffect(
    React.useCallback(() => {
      // focus when screen gains focus
      setTimeout(() => {
        phoneInputRef.current?.focus();
      }, 100);
    }, [])
  );

  return (
    <ThemedView className="flex-1">
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        disableScrollOnKeyboardHide
        // @ts-ignore – prop provided by KeyboardAwareScrollView but missing in types
        enableAutomaticScroll={false}
        scrollEnabled={false}
      >
        <AuthHeader
          title={t("phone_login.header_title")}
          subtitle={t("phone_login.info_text")}
          style={{ paddingVertical: PHONE_LOGIN_LAYOUT.headerPadding }}
        />
        <View className="flex-1 justify-center px-6 pt-4">
          <PhoneInput
            ref={phoneInputRef}
            phoneNumber={phoneNumber}
            countryCode={countryCode}
            countryCodeSelection={countryCodeSelection}
            onPhoneNumberChange={handlePhoneInputChange}
            onCountryCodeChange={handleCountryCodeChange}
            onCountryCodeFocus={handleCountryCodeFocus}
            onCountryCodeBlur={handleCountryCodeBlur}
          />
        </View>
      </KeyboardAwareScrollView>
      <KeyboardStickyView>
        <View className="px-6 py-4" style={stickyViewStyle}>
          <SendCodeButton
            loading={loading}
            disabled={isButtonDisabled}
            onPress={async () => {
              try {
                await handleSendCode();
              } catch (error: any) {
                showToast(error.message || t("phone_login.error_message"), "error");
              }
            }}
            title={t("phone_login.send_code_button")}
          />
        </View>
      </KeyboardStickyView>
    </ThemedView>
  );
};

export default PhoneLoginScreen;

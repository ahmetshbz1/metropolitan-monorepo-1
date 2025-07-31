//  "user-info.tsx"
//  metropolitan app
//  Created by Ahmet on 26.06.2025.
//  Modified by Ahmet on 22.07.2025. - Professional keyboard handling

import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { TextInput, View } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/ThemedView";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { BaseButton } from "@/components/base/BaseButton";
import { BusinessInfoSection } from "@/components/user-info/BusinessInfoSection";
import { PersonalInfoSection } from "@/components/user-info/PersonalInfoSection";
import { TermsSection } from "@/components/user-info/TermsSection";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useUserInfoForm } from "@/hooks/useUserInfoForm";

const UserInfoScreen = () => {
  const { type } = useLocalSearchParams<{ type?: string }>();
  const router = useRouter();
  const isB2B = type === "b2b";
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Refs for input focus management
  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const nipRef = useRef<TextInput>(null);

  // Form state and handlers
  const {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    nip,
    setNip,
    companyData,
    isNipChecking,
    nipError,
    nipWarning,
    canRegister,
    termsAccepted,
    isFormValid,
    isSaving,
    resetNipStatus,
    handleCheckNip,
    handleSave,
  } = useUserInfoForm(isB2B);

  // Memoized keyboard configuration for stability
  const keyboardConfig = useMemo(
    () => ({
      style: { flex: 1 },
      keyboardShouldPersistTaps: "handled" as const,
      showsVerticalScrollIndicator: false,
      contentContainerStyle: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 20,
      },
      // Stable scroll configuration
      bottomOffset: 320, // Footer + space for NIP + CompanyDataCard + Terms visibility
      extraKeyboardSpace: 0, // No extra space to prevent jumpy scroll
      enableOnAndroid: true,
      enableResetScrollToCoords: false, // Prevent automatic scroll reset
    }),
    []
  );

  // Memoized footer style for performance
  const footerStyle = useMemo(
    () => ({
      backgroundColor: themeColors.background,
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: insets.bottom || 16,
    }),
    [themeColors.background, insets.bottom]
  );

  return (
    <ThemedView className="flex-1">
      <KeyboardAwareScrollView {...keyboardConfig}>
        {/* Header Section */}
        <AuthHeader
          title={t("user_info.header_title")}
          subtitle={t("user_info.header_subtitle")}
          style={{ paddingBottom: 16 }}
        />

        {/* Form Content */}
        <View style={{ gap: 24 }}>
          {/* Personal Information Section */}
          <PersonalInfoSection
            firstName={firstName}
            setFirstName={setFirstName}
            lastName={lastName}
            setLastName={setLastName}
            email={email}
            setEmail={setEmail}
            firstNameRef={firstNameRef}
            lastNameRef={lastNameRef}
            emailRef={emailRef}
            nipRef={nipRef}
            themeColors={themeColors}
            t={t}
          />

          {/* Business Information Section - Only for B2B */}
          {isB2B && (
            <BusinessInfoSection
              nip={nip}
              setNip={setNip}
              nipRef={nipRef}
              isNipChecking={isNipChecking}
              nipError={nipError}
              nipWarning={nipWarning}
              companyData={companyData}
              canRegister={canRegister}
              themeColors={themeColors}
              t={t}
              handleCheckNip={handleCheckNip}
              resetNipStatus={resetNipStatus}
            />
          )}

          {/* Terms and Conditions Section */}
          <TermsSection
            termsAccepted={termsAccepted}
            onPress={() => {
              router.push("/terms");
            }}
            themeColors={themeColors}
            t={t}
          />
        </View>
      </KeyboardAwareScrollView>

      {/* Fixed Bottom Button - Sticky Footer */}
      <KeyboardStickyView>
        <View style={footerStyle}>
          <BaseButton
            variant="primary"
            size="small"
            title={t("user_info.save_button")}
            loading={isSaving}
            disabled={!isFormValid}
            onPress={handleSave}
            fullWidth
          />
        </View>
      </KeyboardStickyView>
    </ThemedView>
  );
};

export default UserInfoScreen;

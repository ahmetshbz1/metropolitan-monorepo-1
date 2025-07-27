//  "edit-profile.tsx"
//  metropolitan app
//  Created by Ahmet on 05.07.2025.
//  Modified by Ahmet on 15.07.2025.

import { useNavigation } from "expo-router";
import React, { useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/ThemedView";
import { BaseButton } from "@/components/base/BaseButton";
import { PhotoPreviewModal } from "@/components/profile/edit/PhotoPreviewModal";
import { ProfileForm } from "@/components/profile/edit/ProfileForm";
import { ProfilePhoto } from "@/components/profile/edit/ProfilePhoto";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useImagePicker } from "@/hooks/useImagePicker";
import { useProfileForm } from "@/hooks/useProfileForm";
import { useToast } from "@/hooks/useToast";

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const safeAreaInsets = useSafeAreaInsets();

  // Header title'ı dinamik olarak ayarla
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("edit_profile.title"),
    });
  }, [navigation, t]);

  const {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    emailBlurred,
    setEmailBlurred,
    loading,
    handleSave,
    isSaveDisabled,
  } = useProfileForm();

  const { photoLoading, handleChoosePhoto } = useImagePicker();
  const { showToast } = useToast();

  const [isPhotoPreviewVisible, setPhotoPreviewVisible] = useState(false);

  const handleEditPhoto = () => {
    setPhotoPreviewVisible(false);
    setTimeout(() => handleChoosePhoto(), 200);
  };

  return (
    <ThemedView className="flex-1">
      <PhotoPreviewModal
        visible={isPhotoPreviewVisible}
        onClose={() => setPhotoPreviewVisible(false)}
        onEdit={handleEditPhoto}
      />

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 0,
        }}
        bottomOffset={200}
        extraKeyboardSpace={50}
      >
        <ProfilePhoto
          photoLoading={photoLoading}
          onChoosePhoto={handleChoosePhoto}
          onPreview={() => setPhotoPreviewVisible(true)}
        />
        <ProfileForm
          firstName={firstName}
          setFirstName={setFirstName}
          lastName={lastName}
          setLastName={setLastName}
          email={email}
          setEmail={setEmail}
          emailBlurred={emailBlurred}
          setEmailBlurred={setEmailBlurred}
        />
      </KeyboardAwareScrollView>

      <KeyboardStickyView>
        <View
          className="p-5"
          style={{
            backgroundColor: colors.background,
            paddingBottom: safeAreaInsets.bottom || 20,
          }}
        >
          <BaseButton
            variant="primary"
            size="small"
            title={t("edit_profile.save_button")}
            onPress={async () => {
              try {
                const result = await handleSave();
                if (result?.success) {
                  showToast(result.message, "success");
                }
              } catch (error: any) {
                showToast(
                  error.message || t("edit_profile.error_message"),
                  "error"
                );
              }
            }}
            loading={loading}
            disabled={isSaveDisabled}
            fullWidth
          />
        </View>
      </KeyboardStickyView>
    </ThemedView>
  );
}

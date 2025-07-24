//  "profile.tsx"
//  metropolitan app
//  Created by Ahmet on 09.06.2025.

import { BottomSheetModal } from "@gorhom/bottom-sheet";
import React, { ReactNode, useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView, View } from "react-native";

import CustomBottomSheet from "@/components/CustomBottomSheet";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { AccountSection } from "@/components/profile/AccountSection";
import { AppSettingsSection } from "@/components/profile/AppSettingsSection";
import { LogoutButton } from "@/components/profile/LogoutButton";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { SupportSection } from "@/components/profile/SupportSection";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useAppColorScheme } from "@/context/ColorSchemeContext";
import { useUserSettings } from "@/context/UserSettings";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useUserSettings();
  const { refreshUserProfile } = useAuth();
  const { toggleTheme } = useAppColorScheme();
  const { paddingBottom } = useTabBarHeight();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshUserProfile();
    } catch (error) {
      // NOTE: Hata loglanıyor, kullanıcıya gösterilmiyor
      console.error("Profil yenileme hatası:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshUserProfile]);

  const handlePresentModal = (title: string, content: ReactNode) => {
    setModalTitle(title);
    setModalContent(content);
    bottomSheetRef.current?.present();
  };

  const toggleHaptics = (value: boolean) =>
    updateSettings({ hapticsEnabled: value });

  return (
    <ThemedView className="flex-1 bg-transparent">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 32,
          paddingBottom: paddingBottom + 16,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.tint}
          />
        }
      >
        <View className="items-center mb-6">
          <ProfileHeader />
        </View>
        <View className="mb-4">
          <AccountSection />
        </View>
        <View className="mb-4">
          <AppSettingsSection
            settings={settings}
            toggleHaptics={toggleHaptics}
            toggleTheme={toggleTheme}
            handlePresentModal={handlePresentModal}
            dismissModal={() => bottomSheetRef.current?.dismiss()}
          />
        </View>
        <View className="mb-4">
          <SupportSection handlePresentModal={handlePresentModal} />
        </View>
        <View className="mb-4">
          <LogoutButton />
        </View>
        <View className="items-center mt-2">
          <ThemedText className="text-xs" style={{ color: colors.mediumGray }}>
            {t("profile.version", { version: "1.0.0" })}
          </ThemedText>
        </View>
      </ScrollView>
      <CustomBottomSheet ref={bottomSheetRef} title={modalTitle}>
        {modalContent}
      </CustomBottomSheet>
    </ThemedView>
  );
}

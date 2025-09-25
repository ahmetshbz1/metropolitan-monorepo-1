// "account-settings.tsx"
// metropolitan app
// Account settings page

import { HapticButton } from "@/components/HapticButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useNavigationProtection } from "@/hooks/useNavigationProtection";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import React, { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AccountSettingsScreen() {
  const { t } = useTranslation();
  const safeRouter = useNavigationProtection();
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { user, isGuest } = useAuth();
  const insets = useSafeAreaInsets();

  // Header title'ı dinamik olarak ayarla
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("profile.account_settings"),
    });
  }, [navigation, t]);

  const handleDeleteAccount = () => {
    // Direkt delete-account sayfasına yönlendir
    // Bu sayfa zaten tüm güvenlik kontrollerini ve uyarıları içeriyor
    safeRouter.push("/delete-account");
  };

  const settingsItems = [
    {
      icon: "person-outline" as const,
      title: t("account_settings.edit_profile"),
      subtitle: t("account_settings.edit_profile_desc"),
      onPress: () => safeRouter.push("/edit-profile"),
      showChevron: true,
    },
    {
      icon: "lock-closed-outline" as const,
      title: t("account_settings.privacy"),
      subtitle: t("account_settings.privacy_desc"),
      onPress: () => safeRouter.push("/privacy-settings"),
      showChevron: true,
    },
    {
      icon: "shield-checkmark-outline" as const,
      title: t("account_settings.security"),
      subtitle: t("account_settings.security_desc"),
      onPress: () => safeRouter.push("/security-settings"),
      showChevron: true,
    },
  ];

  const dangerZoneItems = isGuest ? [] : [
    {
      icon: "download-outline" as const,
      title: t("account_settings.export_data"),
      subtitle: t("account_settings.export_data_desc"),
      onPress: () => safeRouter.push("/export-data"),
    },
    {
      icon: "trash-outline" as const,
      title: t("delete_account.title"),
      subtitle: t("account_settings.delete_account_desc"),
      onPress: handleDeleteAccount,
      danger: true,
    },
  ];

  return (
    <ThemedView className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: insets.bottom + 16,
        }}
      >
        {/* User Info Section */}
        <View className="px-4 mb-6">
          <View
            style={{
              padding: 16,
              backgroundColor: colors.card,
              borderRadius: 18,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <View className="flex-row items-center">
              {user?.profilePicture ? (
                <Image
                  source={user.profilePicture}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    marginRight: 12,
                  }}
                  contentFit="cover"
                  accessibilityLabel="Profil fotoğrafı"
                />
              ) : (
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: colors.primary + "20",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Ionicons name="person" size={28} color={colors.primary} />
                </View>
              )}
              <View className="flex-1">
                <ThemedText className="text-lg font-semibold">
                  {user?.firstName || t("account_settings.guest_user")}{" "}
                  {user?.lastName || ""}
                </ThemedText>
                <ThemedText className="text-sm opacity-70">
                  {user?.phoneNumber || t("account_settings.no_phone")}
                </ThemedText>
                {user?.email && (
                  <ThemedText className="text-sm opacity-70">
                    {user.email}
                  </ThemedText>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <View className="px-4 mb-6">
          <ThemedText className="text-sm font-semibold mb-3 opacity-60 uppercase">
            {t("account_settings.general")}
          </ThemedText>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 18,
              overflow: "hidden",
            }}
          >
            {settingsItems.map((item, index) => (
              <HapticButton
                key={item.title}
                onPress={item.onPress}
                activeOpacity={0.7}
                debounceDelay={500} // Navigation için debounce
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  borderBottomWidth: index < settingsItems.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.primary + "15",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Ionicons name={item.icon} size={20} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <ThemedText className="text-base font-medium">
                    {item.title}
                  </ThemedText>
                  <ThemedText className="text-xs opacity-60 mt-1">
                    {item.subtitle}
                  </ThemedText>
                </View>
                {item.showChevron && (
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.mediumGray}
                  />
                )}
              </HapticButton>
            ))}
          </View>
        </View>

        {/* Danger Zone - Only show if not guest */}
        {!isGuest && dangerZoneItems.length > 0 && (
          <View className="px-4 mb-6">
            <ThemedText className="text-sm font-semibold mb-3 opacity-60 uppercase">
              {t("account_settings.danger_zone")}
            </ThemedText>
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 18,
                overflow: "hidden",
              }}
            >
              {dangerZoneItems.map((item, index) => (
              <HapticButton
                key={item.title}
                onPress={item.onPress}
                activeOpacity={0.7}
                debounceDelay={500} // Navigation için debounce
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  borderBottomWidth: index < dangerZoneItems.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.error + "15",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Ionicons name={item.icon} size={20} color={colors.error} />
                </View>
                <View className="flex-1">
                  <ThemedText
                    className="text-base font-medium"
                    style={{ color: colors.error }}
                  >
                    {item.title}
                  </ThemedText>
                  <ThemedText className="text-xs opacity-60 mt-1">
                    {item.subtitle}
                  </ThemedText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.error}
                />
              </HapticButton>
            ))}
            </View>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

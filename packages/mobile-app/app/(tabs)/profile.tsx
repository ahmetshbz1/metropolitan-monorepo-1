//  "profile.tsx"
//  metropolitan app
//  Created by Ahmet on 09.06.2025.

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView, View } from "react-native";
import { useNavigationProtection } from "@/hooks/useNavigationProtection";

import { HapticButton } from "@/components/HapticButton";
import { LogoutButton } from "@/components/profile/LogoutButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";

type ProfileMenuItem = {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
  action?: () => void;
  showChevron?: boolean;
  danger?: boolean;
};

type ProfileMenuSection = {
  title?: string;
  items: ProfileMenuItem[];
};

export default function ProfileScreen() {
  const { t } = useTranslation();
  const safeRouter = useNavigationProtection();
  const { refreshUserProfile, user, isGuest } = useAuth();
  const { paddingBottom } = useTabBarHeight();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshUserProfile();
    } catch (error) {
      console.error("Profil yenileme hatası:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshUserProfile]);

  const sections: ProfileMenuSection[] = [
    {
      title: t("profile.account_section"),
      items: [
        {
          id: "favorites",
          title: t("profile.favorites"),
          icon: "heart-outline",
          route: "/favorites",
          showChevron: true,
        },
        {
          id: "addresses",
          title: t("profile.addresses"),
          icon: "location-outline",
          route: "/addresses",
          showChevron: true,
        },
        {
          id: "notifications",
          title: t("profile.notifications"),
          icon: "notifications-outline",
          route: "/notifications",
          showChevron: true,
        },
        {
          id: "account-settings",
          title: t("profile.account_settings"),
          subtitle: t("profile.account_settings_desc"),
          icon: "settings-outline",
          route: "/account-settings",
          showChevron: true,
        },
      ],
    },
    {
      title: t("profile.app_section"),
      items: [
        {
          id: "app-settings",
          title: t("profile.app_settings"),
          subtitle: t("profile.app_settings_desc"),
          icon: "color-palette-outline",
          route: "/app-settings",
          showChevron: true,
        },
      ],
    },
    {
      title: t("profile.support_section"),
      items: [
        {
          id: "help",
          title: t("profile.help_center"),
          icon: "help-circle-outline",
          route: "/support",
          showChevron: true,
        },
      ],
    },
    {
      title: t("profile.legal_section"),
      items: [
        {
          id: "legal",
          title: t("profile.legal"),
          subtitle: t("profile.legal_desc"),
          icon: "document-text-outline",
          route: "/legal",
          showChevron: true,
        },
      ],
    },
  ];

  const renderMenuItem = (item: ProfileMenuItem, isLast: boolean) => (
    <HapticButton
      key={item.id}
      onPress={() => {
        if (item.route) {
          safeRouter.push(item.route as any);
        } else if (item.action) {
          item.action();
        }
      }}
      activeOpacity={0.7}
      debounceDelay={500} // Navigation için debounce
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: colors.card,
        borderBottomWidth: !isLast ? 1 : 0,
        borderBottomColor: colors.border,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: item.danger
            ? colors.error + "15"
            : colors.primary + "15",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Ionicons
          name={item.icon}
          size={20}
          color={item.danger ? colors.error : colors.primary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <ThemedText
          className="text-base"
          style={{
            color: item.danger ? colors.error : colors.text,
          }}
        >
          {item.title}
        </ThemedText>
        {item.subtitle && (
          <ThemedText className="text-xs opacity-60 mt-0.5">
            {item.subtitle}
          </ThemedText>
        )}
      </View>
      {item.showChevron && (
        <Ionicons name="chevron-forward" size={20} color={colors.mediumGray} />
      )}
    </HapticButton>
  );

  const renderSection = (section: ProfileMenuSection, index: number) => (
    <View key={`section-${index}`} className="mb-5">
      {section.title && (
        <View className="px-4 mb-2">
          <ThemedText className="text-sm font-semibold opacity-60 uppercase">
            {section.title}
          </ThemedText>
        </View>
      )}
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 12,
          overflow: "hidden",
          marginHorizontal: 16,
        }}
      >
        {section.items.map((item, idx) =>
          renderMenuItem(item, idx === section.items.length - 1)
        )}
      </View>
    </View>
  );

  return (
    <ThemedView className="flex-1 bg-transparent">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 20,
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
        {/* User Info Header */}
        <View className="px-4 mb-6">
          <View className="flex-row items-center">
            {user?.profilePicture ? (
              <Image
                source={user.profilePicture}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  marginRight: 12,
                }}
                contentFit="cover"
                accessibilityLabel="Profil fotoğrafı"
              />
            ) : (
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: colors.primary + "20",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Ionicons name="person" size={32} color={colors.primary} />
              </View>
            )}
            <View className="flex-1">
              <ThemedText className="text-xl font-bold">
                {user?.firstName || t("profile.guest")} {user?.lastName || ""}
              </ThemedText>
              <ThemedText className="text-sm opacity-70">
                {user?.phoneNumber || t("profile.no_phone")}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Menu Sections */}
        {sections.map(renderSection)}

        {/* Login/Logout Button */}
        <View className="mb-4">
          {isGuest ? (
            <HapticButton
              className="flex-row items-center justify-center mx-5 mt-5 p-4 rounded-2xl"
              style={{ backgroundColor: colors.primary + "10" }}
              onPress={() => safeRouter.push("/(auth)/")}
              debounceDelay={500} // Navigation için debounce
              accessibilityRole="button"
              accessibilityLabel={t("profile.login")}
            >
              <Ionicons name="log-in-outline" size={22} color={colors.primary} />
              <ThemedText
                className="font-semibold ml-2.5"
                style={{ color: colors.primary }}
              >
                {t("profile.login")}
              </ThemedText>
            </HapticButton>
          ) : (
            <LogoutButton />
          )}
        </View>

        {/* Version Info */}
        <View className="items-center mt-2 mb-4">
          <ThemedText className="text-xs" style={{ color: colors.mediumGray }}>
            {t("profile.version", { version: "1.0.0" })}
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

// "security-settings.tsx"
// metropolitan app
// Security settings page

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import React, { useLayoutEffect, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Switch, View, Alert, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticButton } from "@/components/HapticButton";
import { useToast } from "@/hooks/useToast";
import { api } from "@/core/api";
import { useAuth } from "@/context/AuthContext";
import { useNavigationProtection } from "@/hooks/useNavigationProtection";

interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  deviceTracking: boolean;
}

interface LoginSession {
  id: string;
  deviceName: string;
  lastActive: string;
  location: string;
  isCurrent: boolean;
}

export default function SecuritySettingsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const safeRouter = useNavigationProtection();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { isAuthenticated, user, isGuest } = useAuth();

  const [settings, setSettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    loginAlerts: true,
    deviceTracking: true,
  });
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("security_settings.title"),
    });
  }, [navigation, t]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    if (!isAuthenticated) return;

    // Örnek session verileri (gerçekte API'den gelecek)
    setSessions([
      {
        id: "1",
        deviceName: "iPhone 14 Pro",
        lastActive: t("security_settings.current_session"),
        location: "Warsaw, Poland",
        isCurrent: true,
      },
    ]);
  };

  const updateSetting = async (key: keyof SecuritySettings, value: boolean) => {
    // İki faktörlü doğrulama henüz hazır değil
    if (key === 'twoFactorEnabled') {
      showToast(t("general.feature_soon"), "info");
      return;
    }

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    if (isAuthenticated) {
      setLoading(true);
      try {
        await api.put("/users/user/security-settings", newSettings);
        showToast(t("security_settings.settings_updated"), "success");
      } catch (error) {
        console.error("Failed to update security settings:", error);
        setSettings(settings); // Revert on error
        showToast(t("security_settings.update_failed"), "error");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleChangePhone = () => {
    safeRouter.push("/change-phone");
  };

  const handleEndSession = (sessionId: string) => {
    Alert.alert(
      t("security_settings.end_session_title"),
      t("security_settings.end_session_message"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("security_settings.end_session_confirm"),
          style: "destructive",
          onPress: async () => {
            try {
              // await api.post(`/auth/sessions/${sessionId}/end`);
              setSessions(sessions.filter(s => s.id !== sessionId));
              showToast(t("security_settings.session_ended"), "success");
            } catch (error) {
              showToast(t("security_settings.session_end_failed"), "error");
            }
          },
        },
      ]
    );
  };

  const securityItems = [
    {
      icon: "shield-checkmark-outline",
      title: t("security_settings.two_factor"),
      subtitle: t("security_settings.two_factor_desc"),
      key: "twoFactorEnabled" as const,
      value: settings.twoFactorEnabled,
    },
    {
      icon: "notifications-outline",
      title: t("security_settings.login_alerts"),
      subtitle: t("security_settings.login_alerts_desc"),
      key: "loginAlerts" as const,
      value: settings.loginAlerts,
    },
    {
      icon: "phone-portrait-outline",
      title: t("security_settings.device_tracking"),
      subtitle: t("security_settings.device_tracking_desc"),
      key: "deviceTracking" as const,
      value: settings.deviceTracking,
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
        {/* Guest Warning */}
        {isGuest && (
          <View className="px-4 mb-6">
            <View
              style={{
                padding: 16,
                backgroundColor: colors.warning + "10",
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.warning + "20",
              }}
            >
              <View className="flex-row items-center mb-2">
                <Ionicons
                  name="information-circle"
                  size={24}
                  color={colors.warning}
                />
                <ThemedText className="text-base font-semibold ml-2">
                  {t("security_settings.guest_title")}
                </ThemedText>
              </View>
              <ThemedText className="text-sm opacity-70">
                {t("security_settings.guest_message")}
              </ThemedText>
              <HapticButton
                className="mt-3"
                onPress={() => safeRouter.push("/(auth)/")}
                debounceDelay={500} // Navigation için debounce
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 12,
                  alignSelf: "flex-start",
                }}
              >
                <ThemedText className="text-sm font-medium" style={{ color: "white" }}>
                  {t("profile.login")}
                </ThemedText>
              </HapticButton>
            </View>
          </View>
        )}

        {/* Account Security - Only show if not guest */}
        {!isGuest && (
          <View className="px-4 mb-6">
            <ThemedText className="text-sm font-semibold mb-3 opacity-60 uppercase">
              {t("security_settings.account_security")}
            </ThemedText>
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 18,
                overflow: "hidden",
              }}
            >
              {/* Change Phone Number */}
              <HapticButton
                onPress={handleChangePhone}
                activeOpacity={0.7}
                debounceDelay={500} // Navigation için debounce
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  borderBottomWidth: 1,
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
                <Ionicons name="call-outline" size={20} color={colors.primary} />
              </View>
              <View className="flex-1">
                <ThemedText className="text-base font-medium">
                  {t("security_settings.change_phone")}
                </ThemedText>
                <ThemedText className="text-xs opacity-60 mt-1">
                  {user?.phone || t("security_settings.no_phone")}
                </ThemedText>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.mediumGray}
              />
            </HapticButton>

            {/* Security Settings */}
            {securityItems.map((item, index) => (
              <View
                key={item.key}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  borderBottomWidth: index < securityItems.length - 1 ? 1 : 0,
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
                  <View className="flex-row items-center">
                    <ThemedText className="text-base font-medium">
                      {item.title}
                    </ThemedText>
                    {item.key === 'twoFactorEnabled' && (
                      <View
                        style={{
                          marginLeft: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          backgroundColor: colors.warning + "20",
                          borderRadius: 4,
                        }}
                      >
                        <ThemedText
                          className="text-xs"
                          style={{ color: colors.warning }}
                        >
                          {t("general.soon")}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText className="text-xs opacity-60 mt-1">
                    {item.subtitle}
                  </ThemedText>
                </View>
                {loading && item.value !== settings[item.key] ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Switch
                    value={item.value}
                    onValueChange={(value) => updateSetting(item.key, value)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.card}
                    disabled={loading || item.key === 'twoFactorEnabled'}
                  />
                )}
              </View>
            ))}
          </View>
        </View>
        )}

        {/* Active Sessions */}
        {isAuthenticated && sessions.length > 0 && (
          <View className="px-4 mb-6">
            <ThemedText className="text-sm font-semibold mb-3 opacity-60 uppercase">
              {t("security_settings.active_sessions")}
            </ThemedText>
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 18,
                overflow: "hidden",
              }}
            >
              {sessions.map((session, index) => (
                <View
                  key={session.id}
                  style={{
                    padding: 16,
                    borderBottomWidth: index < sessions.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <View className="flex-row items-center mb-1">
                        <Ionicons
                          name="phone-portrait-outline"
                          size={16}
                          color={colors.primary}
                        />
                        <ThemedText className="text-sm font-medium ml-2">
                          {session.deviceName}
                        </ThemedText>
                        {session.isCurrent && (
                          <View
                            style={{
                              marginLeft: 8,
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              backgroundColor: colors.success + "20",
                              borderRadius: 4,
                            }}
                          >
                            <ThemedText
                              className="text-xs"
                              style={{ color: colors.success }}
                            >
                              {t("security_settings.current")}
                            </ThemedText>
                          </View>
                        )}
                      </View>
                      <ThemedText className="text-xs opacity-60">
                        {session.location}
                      </ThemedText>
                      <ThemedText className="text-xs opacity-60 mt-1">
                        {session.lastActive}
                      </ThemedText>
                    </View>
                    {!session.isCurrent && (
                      <HapticButton
                        onPress={() => handleEndSession(session.id)}
                        style={{
                          padding: 8,
                        }}
                      >
                        <ThemedText
                          className="text-xs font-medium"
                          style={{ color: colors.error }}
                        >
                          {t("security_settings.end_session")}
                        </ThemedText>
                      </HapticButton>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Info Section */}
        <View className="px-4 mb-6">
          <View
            style={{
              padding: 16,
              backgroundColor: colors.primary + "10",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.primary + "30",
            }}
          >
            <View className="flex-row items-start">
              <Ionicons
                name="shield-checkmark-outline"
                size={24}
                color={colors.primary}
                style={{ marginRight: 12, marginTop: 2 }}
              />
              <View className="flex-1">
                <ThemedText className="text-sm font-medium mb-2">
                  {t("security_settings.security_tip_title")}
                </ThemedText>
                <ThemedText className="text-xs opacity-80">
                  {t("security_settings.security_tip_desc")}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {!isAuthenticated && (
          <View className="px-4 mb-6">
            <View
              style={{
                padding: 12,
                backgroundColor: colors.warning + "20",
                borderRadius: 8,
              }}
            >
              <ThemedText className="text-sm text-center">
                {t("security_settings.guest_warning")}
              </ThemedText>
            </View>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}
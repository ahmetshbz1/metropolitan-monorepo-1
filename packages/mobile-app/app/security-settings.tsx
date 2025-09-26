// "security-settings.tsx"
// metropolitan app
// Security settings page

import { HapticButton } from "@/components/HapticButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import api from "@/core/api";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useNavigationProtection } from "@/hooks/useNavigationProtection";
import { useToast } from "@/hooks/useToast";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, ScrollView, Switch, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  deviceTracking: boolean;
}

export default function SecuritySettingsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const safeRouter = useNavigationProtection();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { isAuthenticated, user, isGuest, refreshUserProfile } = useAuth();

  const [settings, setSettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    loginAlerts: true,
    deviceTracking: true,
  });
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("security_settings.title"),
    });
  }, [navigation, t]);

  const updateSetting = async (key: keyof SecuritySettings, value: boolean) => {
    // İki faktörlü doğrulama henüz hazır değil
    if (key === "twoFactorEnabled") {
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

  const handleLinkProvider = async (provider: 'apple' | 'google') => {
    try {
      setLoading(true);

      if (provider === 'apple') {
        // Import Apple auth dynamically
        const { signInWithApple } = await import('@/core/firebase/auth/appleAuth');
        const result = await signInWithApple();

        if (result.success && result.user) {
          // Call backend to link Apple account
          await api.post("/users/me/link-provider", {
            provider: 'apple',
            firebaseUid: result.user.uid,
            appleUserId: result.user.appleUserId,
            email: result.user.email,
          });

          showToast(t("security_settings.connect_success", { provider: 'Apple' }), "success");
          await refreshUserProfile();
        }
      } else if (provider === 'google') {
        // Import Google auth dynamically
        const { signInWithGoogle } = await import('@/core/firebase/auth/googleAuth');
        const result = await signInWithGoogle();

        if (result.success && result.user) {
          // Call backend to link Google account
          await api.post("/users/me/link-provider", {
            provider: 'google',
            firebaseUid: result.user.uid,
            email: result.user.email,
          });

          showToast(t("security_settings.connect_success", { provider: 'Google' }), "success");
          await refreshUserProfile();
        }
      }
    } catch (error: any) {
      console.error("Failed to link provider:", error);

      // Check if it's a provider conflict
      if (error?.response?.data?.error === 'PROVIDER_CONFLICT') {
        showToast(error.response.data.message, "error");
      } else {
        showToast(t("security_settings.connect_failed"), "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkProvider = (provider: 'apple' | 'google') => {
    Alert.alert(
      t("security_settings.disconnect_title"),
      t("security_settings.disconnect_message", { provider: provider === 'apple' ? 'Apple' : 'Google' }),
      [
        {
          text: t("general.cancel"),
          style: "cancel",
        },
        {
          text: t("security_settings.disconnect_confirm"),
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await api.delete("/users/me/social-provider");
              showToast(
                t("security_settings.disconnect_success", { provider: provider === 'apple' ? 'Apple' : 'Google' }),
                "success"
              );
              // Refresh user data
              await refreshUserProfile();
            } catch (error) {
              console.error("Failed to unlink provider:", error);
              showToast(t("security_settings.disconnect_failed"), "error");
            } finally {
              setLoading(false);
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
                <ThemedText
                  className="text-sm font-medium"
                  style={{ color: "white" }}
                >
                  {t("profile.login")}
                </ThemedText>
              </HapticButton>
            </View>
          </View>
        )}

        {/* Linked Accounts - Only show if not guest and not corporate user */}
        {!isGuest && user?.userType !== "corporate" && (
          <View className="px-4 mb-6">
            <ThemedText className="text-sm font-semibold mb-3 opacity-60 uppercase">
              {t("security_settings.linked_accounts")}
            </ThemedText>
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 18,
                overflow: "hidden",
                marginBottom: 20,
              }}
            >
              {/* Google Account */}
              <View
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
                    backgroundColor: "#4285F415",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Ionicons
                    name="logo-google"
                    size={20}
                    color="#4285F4"
                  />
                </View>
                <View className="flex-1">
                  <ThemedText className="text-base font-medium">
                    Google
                  </ThemedText>
                  <ThemedText className="text-xs opacity-60 mt-1">
                    {user?.authProvider === 'google' && user?.email ? user.email : t("security_settings.not_connected")}
                  </ThemedText>
                </View>
                {user?.authProvider === 'google' ? (
                  <HapticButton
                    onPress={() => handleUnlinkProvider('google')}
                    style={{
                      backgroundColor: colors.error + "15",
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 12,
                    }}
                  >
                    <ThemedText className="text-xs font-medium" style={{ color: colors.error }}>
                      {t("security_settings.disconnect")}
                    </ThemedText>
                  </HapticButton>
                ) : !user?.authProvider ? (
                  <HapticButton
                    onPress={() => handleLinkProvider('google')}
                    style={{
                      backgroundColor: colors.primary + "20",
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 12,
                    }}
                  >
                    <ThemedText className="text-xs font-medium" style={{ color: colors.primary }}>
                      {t("security_settings.connect")}
                    </ThemedText>
                  </HapticButton>
                ) : null}
              </View>

              {/* Apple Account */}
              <View
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
                    backgroundColor: colors.text + "15",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Ionicons
                    name="logo-apple"
                    size={20}
                    color={colors.text}
                  />
                </View>
                <View className="flex-1">
                  <ThemedText className="text-base font-medium">
                    Apple
                  </ThemedText>
                  <ThemedText className="text-xs opacity-60 mt-1">
                    {user?.authProvider === 'apple' ? (user?.email || t("security_settings.connected")) : t("security_settings.not_connected")}
                  </ThemedText>
                </View>
                {user?.authProvider === 'apple' ? (
                  <HapticButton
                    onPress={() => handleUnlinkProvider('apple')}
                    style={{
                      backgroundColor: colors.error + "15",
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 12,
                    }}
                  >
                    <ThemedText className="text-xs font-medium" style={{ color: colors.error }}>
                      {t("security_settings.disconnect")}
                    </ThemedText>
                  </HapticButton>
                ) : !user?.authProvider ? (
                  <HapticButton
                    onPress={() => handleLinkProvider('apple')}
                    style={{
                      backgroundColor: colors.primary + "20",
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 12,
                    }}
                  >
                    <ThemedText className="text-xs font-medium" style={{ color: colors.primary }}>
                      {t("security_settings.connect")}
                    </ThemedText>
                  </HapticButton>
                ) : (
                  <View
                    style={{
                      backgroundColor: colors.gray + "20",
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}
                  >
                    <ThemedText className="text-xs" style={{ color: colors.mediumGray }}>
                      {t("security_settings.not_connected")}
                    </ThemedText>
                  </View>
                )}
              </View>

              {/* Phone Number */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
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
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View className="flex-1">
                  <ThemedText className="text-base font-medium">
                    {t("security_settings.phone_number")}
                  </ThemedText>
                  <ThemedText className="text-xs opacity-60 mt-1">
                    {user?.phoneNumber || t("security_settings.no_phone")}
                  </ThemedText>
                </View>
                {user?.phoneNumber && (
                  <View
                    style={{
                      backgroundColor: colors.success + "20",
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}
                  >
                    <ThemedText className="text-xs" style={{ color: colors.success }}>
                      {t("security_settings.connected")}
                    </ThemedText>
                  </View>
                )}
              </View>
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
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View className="flex-1">
                  <ThemedText className="text-base font-medium">
                    {t("security_settings.change_phone")}
                  </ThemedText>
                  <ThemedText className="text-xs opacity-60 mt-1">
                    {user?.phoneNumber || t("security_settings.no_phone")}
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
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <ThemedText className="text-base font-medium">
                        {item.title}
                      </ThemedText>
                      {item.key === "twoFactorEnabled" && (
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
                      trackColor={{
                        false: colors.border,
                        true: colors.primary,
                      }}
                      thumbColor={colors.card}
                      disabled={loading || item.key === "twoFactorEnabled"}
                    />
                  )}
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

// "NotificationPreferencesSheet.tsx"
// metropolitan app
// Notification preferences bottom sheet component

import CustomBottomSheet from "@/components/CustomBottomSheet";
import { ThemedText } from "@/components/ThemedText";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/core/api";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useToast } from "@/hooks/useToast";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Switch, View } from "react-native";

interface NotificationPreferences {
  sms: boolean;
  push: boolean;
  email: boolean;
}

interface NotificationPreferencesSheetProps {
  // Props can be added here if needed in the future
}

export interface NotificationPreferencesSheetRef {
  present: () => void;
  dismiss: () => void;
}

const NotificationPreferencesSheet = forwardRef<
  NotificationPreferencesSheetRef,
  NotificationPreferencesSheetProps
>((props, ref) => {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    sms: true,
    push: true,
    email: true,
  });
  const [loading] = useState(false);
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  useImperativeHandle(ref, () => ({
    present: () => {
      loadPreferences();
      bottomSheetRef.current?.present();
    },
    dismiss: () => bottomSheetRef.current?.dismiss(),
  }));

  // Load preferences when sheet opens
  const loadPreferences = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await api.get("/users/user/notification-preferences");
      if (response.data.success) {
        setPreferences(response.data.preferences);
      }
    } catch (error) {
      console.error("Failed to load notification preferences:", error);
      showToast(t("app_settings.notification_update_failed"), "error");
    }
  };

  // Save preference to backend
  const updatePreference = async (
    type: keyof NotificationPreferences,
    value: boolean
  ) => {
    if (!isAuthenticated) {
      // For guest users, just update local state
      setPreferences((prev) => ({ ...prev, [type]: value }));
      return;
    }

    const newPreferences = { ...preferences, [type]: value };
    setPreferences(newPreferences);

    try {
      const response = await api.put(
        "/users/user/notification-preferences",
        newPreferences
      );
      if (!response.data.success) {
        // Revert on failure
        setPreferences(preferences);
        showToast(t("app_settings.notification_update_failed"), "error");
      } else {
        showToast(t("app_settings.notification_update_success"), "success");
      }
    } catch (error) {
      // Revert on error
      setPreferences(preferences);
      console.error("Failed to update notification preferences:", error);
      showToast(t("app_settings.notification_update_failed"), "error");
    }
  };

  const notificationTypes = [
    {
      key: "sms" as const,
      title: t("app_settings.sms_notifications"),
      description: t("app_settings.sms_notifications_desc"),
      icon: "chatbox-ellipses-outline" as const,
    },
    {
      key: "push" as const,
      title: t("app_settings.push_notifications"),
      description: t("app_settings.push_notifications_desc"),
      icon: "notifications-outline" as const,
    },
    {
      key: "email" as const,
      title: t("app_settings.email_notifications"),
      description: t("app_settings.email_notifications_desc"),
      icon: "mail-outline" as const,
    },
  ];

  const content = (
    <View className="px-4 pb-4">
      {notificationTypes.map((type, index) => (
        <View key={type.key}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 16,
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
              <Ionicons name={type.icon} size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText className="text-base font-medium">
                {type.title}
              </ThemedText>
              <ThemedText className="text-xs opacity-60 mt-1">
                {type.description}
              </ThemedText>
            </View>
            <Switch
              value={preferences[type.key]}
              onValueChange={(value) => updatePreference(type.key, value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
              disabled={loading}
            />
          </View>
          {index < notificationTypes.length - 1 && (
            <View
              style={{
                height: 1,
                backgroundColor: colors.border,
                marginLeft: 52,
              }}
            />
          )}
        </View>
      ))}

      {!isAuthenticated && (
        <View
          style={{
            marginTop: 16,
            padding: 12,
            backgroundColor: colors.warning + "20",
            borderRadius: 8,
          }}
        >
          <ThemedText className="text-sm text-center">
            {t("app_settings.guest_notification_warning")}
          </ThemedText>
        </View>
      )}
    </View>
  );

  return (
    <CustomBottomSheet
      ref={bottomSheetRef}
      title={t("app_settings.notification_preferences")}
    >
      {content}
    </CustomBottomSheet>
  );
});

NotificationPreferencesSheet.displayName = "NotificationPreferencesSheet";

export default NotificationPreferencesSheet;

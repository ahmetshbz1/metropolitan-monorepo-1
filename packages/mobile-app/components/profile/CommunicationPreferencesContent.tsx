//  "CommunicationPreferencesContent.tsx"
//  metropolitan app
//  Created by Ahmet on 29.06.2025.

import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Switch, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { api } from "@/core/api";
import { useToast } from "@/hooks/useToast";

const PreferenceItem = ({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <View
      className="flex-row justify-between items-center py-4"
      style={{
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
      }}
    >
      <ThemedText className="text-lg">{label}</ThemedText>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#dcdcdc", true: "#4CD964" }}
        thumbColor={value ? "#FFFFFF" : "#f4f3f4"}
        ios_backgroundColor="#dcdcdc"
      />
    </View>
  );
};

export function CommunicationPreferencesContent() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { showToast } = useToast();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Backend'den mevcut tercihleri çek
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await api.get('/user/notification-preferences');
        if (response.data.success) {
          setPushNotifications(response.data.preferences.push);
          setEmailNotifications(response.data.preferences.email);
          setSmsNotifications(response.data.preferences.sms);
        }
      } catch (error) {
        console.error('Tercihler yüklenirken hata:', error);
      }
    };
    fetchPreferences();
  }, []);

  // Backend'e kaydet - debounce ile
  const saveToBackend = (push: boolean, email: boolean, sms: boolean) => {
    // Önceki timer'ı iptal et
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Yeni timer başlat - 500ms bekle
    debounceTimer.current = setTimeout(() => {
      api.put('/user/notification-preferences', {
        push,
        email,
        sms,
      }).catch(error => {
        console.error('Tercih güncelleme hatası:', error);
        // Hata durumunda toast göster ama state'i değiştirme
        showToast(t("profile.preferences_update_failed"), "error");
      });
    }, 500);
  };

  // Tercihleri güncelle
  const updatePreferences = (type: 'push' | 'email' | 'sms', value: boolean) => {
    // State'i hemen güncelle
    if (type === 'push') setPushNotifications(value);
    else if (type === 'email') setEmailNotifications(value);
    else if (type === 'sms') setSmsNotifications(value);

    // 300ms sonra backend işlemlerini yap
    setTimeout(() => {
      // Push notification için sistem izni kontrolü
      if (type === 'push' && value === true) {
        import('@/core/firebase/notifications/notificationService').then(async (NotificationService) => {
          try {
            const hasPermission = await NotificationService.default.hasNotificationPermission();
            if (!hasPermission) {
              const token = await NotificationService.default.registerForPushNotifications();
              if (!token) {
                // İzin verilmedi - switch'i geri al
                setPushNotifications(false);
                showToast(t("profile.push_permission_denied"), "error");
                return;
              }
            }
            // İzin var veya alındı - backend'e kaydet
            saveToBackend(value, emailNotifications, smsNotifications);
          } catch (error) {
            console.error('Push notification permission error:', error);
            setPushNotifications(false);
            showToast(t("profile.push_permission_error"), "error");
          }
        });
      } else {
        // Backend'e kaydet (debounced)
        saveToBackend(
          type === 'push' ? value : pushNotifications,
          type === 'email' ? value : emailNotifications,
          type === 'sms' ? value : smsNotifications
        );
      }
    }, 300);
  };

  return (
    <View className="px-2 pt-2">
      <ThemedText
        className="mb-5 text-sm leading-5 text-center"
        style={{ color: colors.textSecondary }}
      >
        {t("profile.communication_preferences_description")}
      </ThemedText>
      <PreferenceItem
        label={t("profile.push_notifications")}
        value={pushNotifications}
        onValueChange={(value) => updatePreferences('push', value)}
      />
      <PreferenceItem
        label={t("profile.email_notifications")}
        value={emailNotifications}
        onValueChange={(value) => updatePreferences('email', value)}
      />
      <PreferenceItem
        label={t("profile.sms_notifications")}
        value={smsNotifications}
        onValueChange={(value) => updatePreferences('sms', value)}
      />
    </View>
  );
}

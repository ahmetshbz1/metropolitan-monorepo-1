//  "ConfirmationDialog.tsx"
//  metropolitan app

import React from "react";
import { Modal, View, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { HapticButton } from "@/components/HapticButton";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BlurView } from "expo-blur";

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  icon?: IconName;
  iconColor?: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  visible,
  title,
  message,
  icon = "alert-circle-outline",
  iconColor,
  confirmText,
  cancelText,
  confirmButtonColor,
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();
  const { colors, colorScheme } = useTheme();

  const defaultConfirmText = confirmText || t("common.ok");
  const defaultCancelText = cancelText || t("common.cancel");
  const defaultIconColor = iconColor || (destructive ? colors.danger : colors.tint);
  const defaultConfirmColor = confirmButtonColor || (destructive ? colors.danger : colors.tint);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <BlurView
        intensity={colorScheme === "dark" ? 80 : 60}
        tint={colorScheme === "dark" ? "dark" : "light"}
        className="flex-1 justify-center items-center px-6"
      >
        <View
          className="w-full max-w-sm rounded-2xl p-6"
          style={{
            backgroundColor: colors.cardBackground,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <View className="items-center mb-4">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: `${defaultIconColor}15` }}
            >
              <Ionicons name={icon} size={32} color={defaultIconColor} />
            </View>

            <ThemedText className="text-xl font-bold text-center mb-3">
              {title}
            </ThemedText>

            <ThemedText className="text-center opacity-70">
              {message}
            </ThemedText>
          </View>

          <View className="flex-row gap-3">
            <HapticButton
              onPress={onCancel}
              disabled={loading}
              className="flex-1 py-3.5 rounded-xl border items-center justify-center"
              style={{
                borderColor: colors.border,
                opacity: loading ? 0.5 : 1,
              }}
            >
              <ThemedText className="font-semibold">
                {defaultCancelText}
              </ThemedText>
            </HapticButton>

            <HapticButton
              onPress={onConfirm}
              disabled={loading}
              className="flex-1 py-3.5 rounded-xl items-center justify-center"
              style={{
                backgroundColor: defaultConfirmColor,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText className="font-semibold" style={{ color: "#fff" }}>
                  {defaultConfirmText}
                </ThemedText>
              )}
            </HapticButton>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

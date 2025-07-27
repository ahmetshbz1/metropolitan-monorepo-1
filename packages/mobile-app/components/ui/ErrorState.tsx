//  "ErrorState.tsx"
//  metropolitan app
//  Created by Ahmet on 05.06.2025.

import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ThemedText } from "../ThemedText";
import { BaseButton } from "../base/BaseButton";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { t } = useTranslation();

  return (
    <BlurView
      intensity={10}
      tint={colorScheme}
      style={{
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
      }}
    >
      <View className="justify-center items-center p-5 rounded-2xl w-4/5">
        <Ionicons
          name="cloud-offline-outline"
          size={80}
          color={colors.mediumGray}
        />
        <ThemedText className="text-xl font-bold mt-5 text-center">
          {t("common.error_title")}
        </ThemedText>
        <ThemedText
          className="text-base text-center mt-2.5 mb-8"
          style={{ color: "#888" }}
        >
          {message}
        </ThemedText>
        <BaseButton
          variant="primary"
          size="small"
          title={t("common.retry")}
          onPress={onRetry}
          fullWidth={false}
        />
      </View>
    </BlurView>
  );
}

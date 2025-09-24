//  "legal-webview.tsx"
//  metropolitan app
//  Created by Ahmet on 22.09.2025.

import React, { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function LegalWebViewScreen() {
  const { url, title } = useLocalSearchParams<{
    url: string;
    title: string;
  }>();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const handleLoadStart = () => {
    setLoading(true);
    setError(false);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  return (
    <ThemedView className="flex-1">
      <Stack.Screen
        options={{
          title: title || t("legal.title"),
        }}
      />
      {error ? (
        <View className="flex-1 justify-center items-center px-4">
          <Ionicons name="alert-circle" size={48} color={colors.destructive} />
          <ThemedText className="text-center mt-4 text-base">
            {t("common.page_load_error")}
          </ThemedText>
          <ThemedText className="text-center mt-2 text-sm" style={{ color: colors.mediumGray }}>
            {t("common.connection_error")}
          </ThemedText>
          <TouchableOpacity
            onPress={() => {
              setError(false);
              setLoading(false);
            }}
            className="mt-4 px-6 py-3 rounded-lg"
            style={{ backgroundColor: colors.tint }}
          >
            <ThemedText className="text-white font-medium">
              {t("common.retry")}
            </ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {loading && (
            <View className="absolute inset-0 justify-center items-center z-10">
              <ActivityIndicator size="large" color={colors.tint} />
              <ThemedText className="mt-4" style={{ color: colors.mediumGray }}>
                {t("common.loading")}
              </ThemedText>
            </View>
          )}

          {url && (
            <WebView
              source={{ uri: url }}
              onLoadStart={handleLoadStart}
              onLoadEnd={handleLoadEnd}
              onError={handleError}
              style={{ flex: 1 }}
              startInLoadingState={false}
              scalesPageToFit={true}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
            />
          )}
        </>
      )}
    </ThemedView>
  );
}
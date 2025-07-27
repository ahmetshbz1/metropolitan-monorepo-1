//  "terms.tsx"
//  metropolitan app
//  Created by Ahmet on 02.07.2025.

import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  NativeScrollEvent,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BaseButton } from "@/components/base/BaseButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { api } from "@/core/api";
import { useColorScheme } from "@/hooks/useColorScheme";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ContentItem = {
  type: "header" | "paragraph";
  text: string;
};

export default function TermsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  useColorScheme();
  const insets = useSafeAreaInsets();

  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const response = await api.get("/content/terms");
        if (response.data.success) {
          setContent(response.data.data.content);
        }
      } catch (error) {
        console.error("Failed to fetch terms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, []);

  const handleScroll = (event: NativeScrollEvent) => {
    const { layoutMeasurement, contentOffset, contentSize } = event;
    const isAtBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 20; // 20px threshold
    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAgree = async () => {
    await AsyncStorage.setItem("terms_accepted_temp", "true");
    router.back();
  };

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;
    }
    return content.map((item, index) => (
      <ThemedText
        key={index}
        className={
          item.type === "header"
            ? "text-2xl font-bold mb-2.5 mt-4"
            : "text-base leading-6 mb-4"
        }
      >
        {item.text}
      </ThemedText>
    ));
  };

  return (
    <ThemedView className="flex-1">
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        onScroll={({ nativeEvent }) => handleScroll(nativeEvent)}
        scrollEventThrottle={400} // Check scroll position every 400ms
      >
        {renderContent()}
      </ScrollView>
      <View className="p-4 pb-8" style={{ paddingBottom: insets.bottom || 20 }}>
        <BaseButton
          variant="primary"
          size="small"
          title={t("terms.agree_button")}
          disabled={!hasScrolledToBottom}
          onPress={handleAgree}
          fullWidth
          style={{ marginBottom: 10 }}
        />
        <BaseButton
          variant="secondary"
          size="small"
          title={t("terms.close_button")}
          onPress={() => router.back()}
          fullWidth
        />
      </View>
    </ThemedView>
  );
}

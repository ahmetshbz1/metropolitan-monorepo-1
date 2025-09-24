// "json-viewer.tsx"
// metropolitan app
// JSON content viewer with syntax highlighting

import { HapticButton } from "@/components/HapticButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useToast } from "@/hooks/useToast";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function JsonViewerScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const params = useLocalSearchParams();

  const fileName = params.fileName as string;
  const content = params.content as string;

  // Header title'ı dinamik olarak ayarla
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("json_viewer.title"), // Her zaman "İçerik Önizleme"
    });
  }, [navigation, t]);

  const copyContent = async () => {
    try {
      await Clipboard.setStringAsync(content);
      showToast(t("json_viewer.content_copied"), "success", 2000);
    } catch (error) {
      showToast("Kopyalama başarısız", "error");
    }
  };

  // JSON syntax highlighting
  const renderJsonWithHighlighting = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      const formatted = JSON.stringify(parsed, null, 2);

      // Simple syntax highlighting with colors
      const highlighted = formatted.split("\n").map((line, index) => {
        const trimmedLine = line.trim();
        let color = themeColors.text;
        let fontWeight: "normal" | "bold" = "normal";

        // Keys (property names)
        if (trimmedLine.includes(":") && trimmedLine.startsWith('"')) {
          const keyMatch = trimmedLine.match(/^"([^"]+)":/);
          if (keyMatch) {
            const key = keyMatch[1];
            const rest = trimmedLine.substring(keyMatch[0].length);

            return (
              <Text
                key={index}
                style={{
                  color: themeColors.text,
                  fontSize: 14,
                  fontFamily: "monospace",
                }}
              >
                {line.substring(0, line.indexOf('"'))}
                <Text style={{ color: "#0066CC", fontWeight: "bold" }}>
                  "{key}"
                </Text>
                <Text style={{ color: themeColors.text }}>:</Text>
                <Text
                  style={{ color: getValueColor(rest.trim(), themeColors) }}
                >
                  {rest}
                </Text>
                {"\n"}
              </Text>
            );
          }
        }

        // Brackets and braces
        if (
          trimmedLine === "{" ||
          trimmedLine === "}" ||
          trimmedLine === "[" ||
          trimmedLine === "]"
        ) {
          color = "#8B5CF6";
          fontWeight = "bold";
        }

        return (
          <Text
            key={index}
            style={{
              color,
              fontWeight,
              fontSize: 14,
              fontFamily: "monospace",
            }}
          >
            {line + "\n"}
          </Text>
        );
      });

      return highlighted;
    } catch (error) {
      // If JSON parsing fails, show as plain text
      return (
        <Text
          style={{
            color: themeColors.text,
            fontSize: 14,
            fontFamily: "monospace",
          }}
        >
          {content}
        </Text>
      );
    }
  };

  const getValueColor = (value: string, themeColors: any) => {
    const trimmed = value.trim().replace(/,$/, ""); // Remove trailing comma

    if (trimmed === "null") return "#8B5CF6";
    if (trimmed === "true" || trimmed === "false") return "#059669";
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) return "#DC2626";
    if (!isNaN(Number(trimmed))) return "#EA580C";

    return themeColors.text;
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      {/* Header with copy button */}
      <View
        className="flex-row items-center justify-between px-6 py-4"
        style={{
          borderBottomWidth: 1,
          borderBottomColor: themeColors.border,
        }}
      >
        <View className="flex-1">
          <ThemedText className="text-base font-medium">
            {t("json_viewer.user_data")}
          </ThemedText>
          <ThemedText className="text-sm opacity-70">
            {content.length} karakter • JSON formatı
          </ThemedText>
        </View>

        <HapticButton
          onPress={copyContent}
          className="flex-row items-center px-4 py-2 rounded-lg"
          style={{
            backgroundColor: themeColors.primary,
          }}
        >
          <Ionicons name="copy-outline" size={16} color="white" />
          <ThemedText className="text-white text-sm font-medium ml-2">
            {t("json_viewer.copy_content")}
          </ThemedText>
        </HapticButton>
      </View>

      {/* JSON Content */}
      <ScrollView
        className="flex-1"
        style={{
          backgroundColor: themeColors.card,
        }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 16,
        }}
      >
        <View
          className="p-4 rounded-lg"
          style={{
            backgroundColor: themeColors.background,
            borderWidth: 1,
            borderColor: themeColors.border,
          }}
        >
          {renderJsonWithHighlighting(content)}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

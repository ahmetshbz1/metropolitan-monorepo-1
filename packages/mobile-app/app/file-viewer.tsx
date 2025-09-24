// "file-viewer.tsx"
// metropolitan app
// ZIP file viewer with password protection and in-app content viewing

import { HapticButton } from "@/components/HapticButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { BaseButton } from "@/components/base/BaseButton";
import { BaseInput } from "@/components/base/BaseInput";
import Colors from "@/constants/Colors";
import { api } from "@/core/api";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useToast } from "@/hooks/useToast";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, View } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ArchiveFile {
  name: string;
  size: number;
  content?: string;
}

export default function FileViewerScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const params = useLocalSearchParams();

  // URL parametrelerinden dosya bilgilerini al
  const fileUri = params.fileUri as string;
  const fileName = params.fileName as string;
  const defaultPassword = params.password as string;

  const [password, setPassword] = useState(defaultPassword || "");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [archiveFiles, setArchiveFiles] = useState<ArchiveFile[]>([]);

  // Header title'ı dinamik olarak ayarla
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("file_viewer.title"),
    });
  }, [navigation, t]);

  const handleUnlock = async () => {
    if (!password.trim()) {
      showToast(t("file_viewer.enter_password"), "error");
      return;
    }

    setIsUnlocking(true);
    try {
      // Backend'e şifre ile ZIP açma isteği gönder
      const fileName = fileUri.split("/").pop() || "export.zip";
      const token = (params.token as string) || "dummy-token";

      const response = await api.post(`/users/view-export/${fileName}`, {
        password: password,
        token: token,
      });

      if (!response.data.success) {
        throw new Error("Backend extraction failed");
      }

      // Backend'den gelen dosya listesini işle
      const files: ArchiveFile[] = response.data.files.map((file: any) => ({
        name: file.name,
        size: file.size,
        content: file.content
          ? JSON.stringify(file.content, null, 2)
          : undefined,
      }));

      setArchiveFiles(files);
      setIsUnlocked(true);
      showToast(
        t("file_viewer.files_in_archive") + `: ${files.length}`,
        "success"
      );
      return; // Başarılı, catch bloğuna gitme
    } catch (error: any) {
      console.error("Unlock error:", error);
      if (error.response?.status === 400) {
        showToast(t("file_viewer.wrong_password"), "error");
      } else {
        showToast(t("file_viewer.extraction_failed"), "error");
      }
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleViewContent = (file: ArchiveFile) => {
    if (!file.content) {
      showToast("Bu dosya türü görüntülenemiyor", "error");
      return;
    }

    Alert.alert(
      file.name,
      file.content,
      [{ text: "Tamam", style: "default" }],
      { cancelable: true }
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 py-4">
          {/* Dosya Bilgisi */}
          <View
            className="p-4 rounded-xl mb-6"
            style={{
              backgroundColor: themeColors.card,
              borderColor: themeColors.border,
              borderWidth: 1,
            }}
          >
            <View className="flex-row items-center mb-2">
              <Ionicons
                name="document-outline"
                size={24}
                color={themeColors.text}
                style={{ marginRight: 12 }}
              />
              <View className="flex-1">
                <ThemedText className="text-sm opacity-70">
                  {t("file_viewer.file_name")}
                </ThemedText>
                <ThemedText className="text-base font-medium">
                  {fileName}
                </ThemedText>
              </View>
            </View>
          </View>

          {!isUnlocked ? (
            /* Şifre Giriş Formu */
            <View className="mb-6">
              <BaseInput
                label={t("file_viewer.enter_password")}
                placeholder={t("file_viewer.password_placeholder")}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleUnlock}
                rightIcon={
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={themeColors.textSecondary}
                  />
                }
              />
            </View>
          ) : (
            /* Dosya Listesi */
            <View className="mb-6">
              <ThemedText className="text-lg font-semibold mb-4">
                {t("file_viewer.files_in_archive")}
              </ThemedText>

              {archiveFiles.length === 0 ? (
                <View
                  className="p-6 rounded-xl items-center"
                  style={{
                    backgroundColor: themeColors.card,
                    borderColor: themeColors.border,
                    borderWidth: 1,
                  }}
                >
                  <Ionicons
                    name="folder-open-outline"
                    size={48}
                    color={themeColors.textSecondary}
                    style={{ marginBottom: 12 }}
                  />
                  <ThemedText className="text-center opacity-70">
                    {t("file_viewer.no_files")}
                  </ThemedText>
                </View>
              ) : (
                <ScrollView
                  style={{
                    maxHeight: 400,
                    backgroundColor: themeColors.card,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: themeColors.border,
                  }}
                >
                  {archiveFiles.map((file, index) => (
                    <View
                      key={index}
                      className="flex-row items-center justify-between p-4"
                      style={{
                        borderBottomWidth:
                          index < archiveFiles.length - 1 ? 1 : 0,
                        borderBottomColor: themeColors.border,
                      }}
                    >
                      <View className="flex-1 mr-3">
                        <ThemedText className="text-base font-medium mb-1">
                          {file.name}
                        </ThemedText>
                        <ThemedText className="text-sm opacity-70">
                          {formatFileSize(file.size)}
                        </ThemedText>
                      </View>

                      {file.content && (
                        <HapticButton
                          onPress={() => handleViewContent(file)}
                          className="px-3 py-2 rounded-lg"
                          style={{
                            backgroundColor: themeColors.primary,
                          }}
                        >
                          <ThemedText className="text-white text-sm font-medium">
                            {t("file_viewer.view_content")}
                          </ThemedText>
                        </HapticButton>
                      )}
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          )}
        </View>
      </KeyboardAwareScrollView>

      {/* Bottom Button */}
      {!isUnlocked && (
        <KeyboardStickyView>
          <View
            className="px-6 py-4"
            style={{
              paddingBottom: insets.bottom || 16,
              backgroundColor: themeColors.background,
            }}
          >
            <BaseButton
              variant="primary"
              size="small"
              title={t("file_viewer.unlock")}
              loading={isUnlocking}
              disabled={!password.trim()}
              onPress={handleUnlock}
              fullWidth
            />
          </View>
        </KeyboardStickyView>
      )}
    </ThemedView>
  );
}

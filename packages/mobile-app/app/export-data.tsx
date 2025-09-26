// "export-data.tsx"
// metropolitan app
// Data export page with email and direct download options

import { HapticButton } from "@/components/HapticButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { BaseButton } from "@/components/base/BaseButton";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/core/api";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useToast } from "@/hooks/useToast";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system";
import { useNavigation, useRouter } from "expo-router";
import React, { useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ExportDataScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<
    "email" | "download" | null
  >(null);
  const [filePassword, setFilePassword] = useState<string | null>(null);
  const [downloadedFileUri, setDownloadedFileUri] = useState<string | null>(
    null
  );

  // Header title'ı dinamik olarak ayarla
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("export_data.title"),
    });
  }, [navigation, t]);

  const handleEmailExport = async () => {
    setLoading(true);
    try {
      const response = await api.post("/users/export-data", {
        method: "email",
      });

      if (response.data.success) {
        showToast(t("export_data.email_success"), "success", 4000);
      } else {
        showToast(t("export_data.export_error"), "error");
      }
    } catch (error) {
      // Removed console statement
      showToast(t("export_data.export_error"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDirectDownload = async () => {
    setLoading(true);
    try {
      const response = await api.post("/users/export-data", {
        method: "download",
      });

      if (response.data.success && response.data.downloadUrl) {
        // Şifreyi state'e kaydet
        if (response.data.password) {
          setFilePassword(response.data.password);
        }

        // Dosyayı indir - response.data.downloadUrl zaten relative path (/users/download-export/...)
        await downloadAndSaveFile(response.data.downloadUrl);
      } else {
        showToast(t("export_data.export_error"), "error");
      }
    } catch (error) {
      // Removed console statement
      showToast(t("export_data.export_error"), "error");
    } finally {
      setLoading(false);
    }
  };

  const downloadAndSaveFile = async (downloadPath: string) => {
    try {
      // Backend'den gelen dosya adını kullan
      const urlMatch = downloadPath.match(/\/users\/download-export\/([^?]+)/);
      const fileName = urlMatch
        ? urlMatch[1]
        : `verilerim_${new Date().getTime()}.zip`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      // Dosyayı indir
      showToast(t("export_data.downloading"), "info", 2000);

      // API client ile dosyayı indir (auth token otomatik eklenir)
      // downloadPath zaten relative path (/users/download-export/...)
      const response = await api.get(downloadPath, {
        responseType: "arraybuffer", // Binary data için
      });

      // Binary data'yı base64'e çevir ve dosyaya yaz
      const base64Data = btoa(
        new Uint8Array(response.data).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );

      // Dosyayı binary olarak yaz
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Dosya URI'sini state'e kaydet
      setDownloadedFileUri(fileUri);

      // Dosya başarıyla kaydedildi mesajı göster
      showToast(t("export_data.file_saved"), "success", 3000);
    } catch (error) {
      // Removed console statement
      showToast(t("export_data.download_failed"), "error");
    }
  };

  const copyPasswordToClipboard = async () => {
    if (filePassword) {
      await Clipboard.setStringAsync(filePassword);
      showToast(t("export_data.password_copied"), "success", 2000);
    }
  };

  const openDownloadedFile = async () => {
    if (downloadedFileUri && filePassword) {
      try {
        // Backend'den gelen download URL'inden dosya adını çıkar
        // downloadUrl format: /users/download-export/FILENAME?token=TOKEN
        const urlMatch = downloadedFileUri.match(
          /\/users\/download-export\/([^?]+)/
        );
        const backendFileName = urlMatch ? urlMatch[1] : "export.zip";

        // Token'ı URL'den çıkar
        const urlParts = downloadedFileUri.split("?token=");
        const token = urlParts.length > 1 ? urlParts[1] : "dummy-token";

        router.push({
          pathname: "/file-viewer",
          params: {
            fileUri: downloadedFileUri,
            fileName: backendFileName, // Backend'den gelen orijinal dosya adı
            password: filePassword,
            token: token,
          },
        });
      } catch (error) {
        // Removed console statement
        showToast("Dosya görüntüleyici açılamadı", "error");
      }
    }
  };

  const exportOptions = [
    {
      id: "email",
      title: t("export_data.email_option"),
      subtitle: t("export_data.email_option_desc"),
      icon: "mail-outline",
      color: themeColors.primary,
      action: handleEmailExport,
    },
    {
      id: "download",
      title: t("export_data.download_option"),
      subtitle: t("export_data.download_option_desc"),
      icon: "download-outline",
      color: themeColors.success,
      action: handleDirectDownload,
    },
  ];

  return (
    <ThemedView className="flex-1">
      <KeyboardAwareScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
        }}
        keyboardShouldPersistTaps="always"
      >
        <View className="flex-1 pt-8">
          {/* Info Section */}
          <View className="mb-8">
            <View className="flex-row items-center mb-4">
              <MaterialCommunityIcons
                name="information-outline"
                size={24}
                color={themeColors.primary}
                style={{ marginRight: 12 }}
              />
              <ThemedText
                className="text-lg font-semibold"
                style={{ color: themeColors.primary }}
              >
                {t("export_data.info_title")}
              </ThemedText>
            </View>

            <ThemedText className="text-sm opacity-70 mb-6 leading-6">
              {t("export_data.info_desc")}
            </ThemedText>

            {/* Data Types Info */}
            <View
              className="p-4 rounded-2xl border"
              style={{
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
              }}
            >
              <ThemedText className="text-sm font-medium mb-3">
                {t("export_data.included_data")}
              </ThemedText>
              <View className="space-y-2">
                <ThemedText className="text-xs opacity-70">
                  • {t("export_data.data_profile")}
                </ThemedText>
                <ThemedText className="text-xs opacity-70">
                  • {t("export_data.data_orders")}
                </ThemedText>
                <ThemedText className="text-xs opacity-70">
                  • {t("export_data.data_addresses")}
                </ThemedText>
                <ThemedText className="text-xs opacity-70">
                  • {t("export_data.data_preferences")}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Export Options */}
          <View className="mb-6">
            <ThemedText className="text-sm font-semibold mb-4 opacity-60 uppercase">
              {t("export_data.export_methods")}
            </ThemedText>
            <View
              style={{
                backgroundColor: themeColors.card,
                borderRadius: 18,
                overflow: "hidden",
              }}
            >
              {exportOptions.map((option, index) => (
                <HapticButton
                  key={option.id}
                  onPress={() =>
                    setSelectedOption(option.id as "email" | "download")
                  }
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 16,
                    borderBottomWidth: index < exportOptions.length - 1 ? 1 : 0,
                    borderBottomColor: themeColors.border,
                    backgroundColor:
                      selectedOption === option.id
                        ? option.color + "10"
                        : "transparent",
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: option.color + "20",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={20}
                      color={option.color}
                    />
                  </View>
                  <View className="flex-1">
                    <ThemedText className="text-base font-medium">
                      {option.title}
                    </ThemedText>
                    <ThemedText className="text-xs opacity-60 mt-1">
                      {option.subtitle}
                    </ThemedText>
                  </View>
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor:
                        selectedOption === option.id
                          ? option.color
                          : themeColors.border,
                      backgroundColor:
                        selectedOption === option.id
                          ? option.color
                          : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {selectedOption === option.id && (
                      <Ionicons name="checkmark" size={12} color="white" />
                    )}
                  </View>
                </HapticButton>
              ))}
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* File Password Display */}
      {filePassword && (
        <View
          className="mx-6 mb-4 p-4 rounded-xl"
          style={{
            backgroundColor: themeColors.card,
            borderColor: themeColors.border,
            borderWidth: 1,
          }}
        >
          <View className="flex-row items-center mb-2">
            <Ionicons
              name="lock-closed"
              size={20}
              color={themeColors.text}
              style={{ marginRight: 8 }}
            />
            <ThemedText className="text-base font-semibold">
              {t("export_data.file_password")}
            </ThemedText>
          </View>

          <ThemedText className="text-sm mb-3 opacity-70">
            {t("export_data.file_password_desc")}
          </ThemedText>

          <View
            className="flex-row items-center justify-between p-3 rounded-lg"
            style={{
              backgroundColor: themeColors.background,
              borderColor: themeColors.border,
              borderWidth: 1,
            }}
          >
            <View className="flex-row items-center flex-1">
              <ThemedText className="text-base font-mono mr-2">
                {filePassword}
              </ThemedText>

              <Ionicons
                name="copy-outline"
                size={20}
                color={themeColors.primary}
                onPress={copyPasswordToClipboard}
                style={{ padding: 4 }} // Dokunma alanını büyütür
              />
            </View>

            {downloadedFileUri && (
              <HapticButton
                onPress={openDownloadedFile}
                className="flex-row items-center px-3 py-2 rounded-lg ml-3"
                style={{
                  backgroundColor: themeColors.success || "#10B981",
                }}
              >
                <Ionicons name="folder-open-outline" size={16} color="white" />
                <Text className="text-white text-sm font-medium ml-1">
                  {t("export_data.open_file")}
                </Text>
              </HapticButton>
            )}
          </View>
        </View>
      )}

      {/* Bottom Button */}
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
            title={t("export_data.start_export")}
            loading={loading}
            disabled={!selectedOption}
            onPress={() => {
              if (selectedOption === "email") {
                handleEmailExport();
              } else if (selectedOption === "download") {
                handleDirectDownload();
              }
            }}
            fullWidth
          />
        </View>
      </KeyboardStickyView>
    </ThemedView>
  );
}

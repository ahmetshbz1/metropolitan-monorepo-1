//  "ClearCacheSheet.tsx"
//  metropolitan app
//  Created by Ahmet on 29.09.2025.

import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import React, { forwardRef, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import Colors from "@/constants/Colors";
import { clearAllAuthData } from "@/context/auth/storage";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useToast } from "@/hooks/useToast";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import {
  offlineCache,
  orderCache,
  productCache,
  userCache,
} from "@/services/offline-cache.service";
import CustomBottomSheet from "./CustomBottomSheet";
import { HapticButton } from "./HapticButton";
import { ThemedText } from "./ThemedText";

type Ref = BottomSheetModal;

const ClearCacheSheet = forwardRef<Ref>((_, ref) => {
  const { t } = useTranslation();
  const { dialogState, showDialog, hideDialog, handleConfirm } = useConfirmationDialog();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { showToast } = useToast();

  const clearCacheOnly = useCallback(async () => {
    try {
      // AsyncStorage'dan sadece cache ile ilgili verileri temizle
      // Auth ile ilgili key'leri koru
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToRemove = allKeys.filter(
        (key) =>
          !key.includes("user_data") &&
          !key.includes("guest_id") &&
          !key.includes("is_guest") &&
          !key.includes("access_token") &&
          !key.includes("refresh_token") &&
          !key.includes("auth_token") &&
          !key.includes("social_auth_data")
      );

      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }

      // Clear offline cache services
      await Promise.all([
        offlineCache.clear(),
        productCache.clear(),
        userCache.clear(),
        orderCache.clear(),
      ]);

      // Clear image cache directory
      const cacheDirectory = FileSystem.cacheDirectory;
      if (cacheDirectory) {
        const cacheFiles = await FileSystem.readDirectoryAsync(cacheDirectory);
        await Promise.all(
          cacheFiles.map((file) =>
            FileSystem.deleteAsync(`${cacheDirectory}${file}`, {
              idempotent: true,
            })
          )
        );
      }

      // Clear document directory temporary files
      const documentDirectory = FileSystem.documentDirectory;
      if (documentDirectory) {
        const tempDir = `${documentDirectory}temp/`;
        const exists = await FileSystem.getInfoAsync(tempDir);
        if (exists.exists) {
          await FileSystem.deleteAsync(tempDir, { idempotent: true });
        }
      }

      showToast(t("app_settings.clear_cache_success"), "success");

      // Close the bottom sheet
      if (ref && "current" in ref) {
        ref.current?.dismiss();
      }
    } catch (error) {
      showToast(t("app_settings.clear_cache_error"), "error");
    }
  }, [ref, showToast, t]);

  const clearAllData = useCallback(() => {
    showDialog({
      title: t("app_settings.clear_all_data_confirm_title"),
      message: t("app_settings.clear_all_data_confirm_message"),
      icon: "trash-outline",
      confirmText: t("app_settings.clear_all_data_confirm_button"),
      cancelText: t("common.cancel"),
      destructive: true,
      onConfirm: async () => {
            try {
              // Tüm auth verilerini temizle
              await clearAllAuthData();

              // Tüm AsyncStorage'ı temizle
              await AsyncStorage.clear();

              // Offline cache'leri temizle
              await Promise.all([
                offlineCache.clear(),
                productCache.clear(),
                userCache.clear(),
                orderCache.clear(),
              ]);

              // Cache dosyalarını temizle
              const cacheDirectory = FileSystem.cacheDirectory;
              if (cacheDirectory) {
                const cacheFiles =
                  await FileSystem.readDirectoryAsync(cacheDirectory);
                await Promise.all(
                  cacheFiles.map((file) =>
                    FileSystem.deleteAsync(`${cacheDirectory}${file}`, {
                      idempotent: true,
                    })
                  )
                );
              }

              // Document directory'yi temizle
              const documentDirectory = FileSystem.documentDirectory;
              if (documentDirectory) {
                const tempDir = `${documentDirectory}temp/`;
                const exists = await FileSystem.getInfoAsync(tempDir);
                if (exists.exists) {
                  await FileSystem.deleteAsync(tempDir, { idempotent: true });
                }
              }

              // Close the bottom sheet
              if (ref && "current" in ref) {
                ref.current?.dismiss();
              }

              // Başarı mesajını göster
              showToast(t("app_settings.clear_all_data_success"), "success");
            } catch (error) {
              showToast(t("app_settings.clear_cache_error"), "error");
            }
      },
    });
  }, [ref, showToast, showDialog, t]);

  return (
    <CustomBottomSheet
      ref={ref}
      title={t("app_settings.clear_cache_sheet_title")}
      snapPoints={["40%"]}
      keepMounted={true}
    >
      <View className="px-5">
        <ThemedText className="text-sm opacity-60 mb-6 text-center leading-5">
          {t("app_settings.clear_cache_sheet_subtitle")}
        </ThemedText>

        {/* Option 1: Clear Cache Only */}
        <HapticButton
          onPress={clearCacheOnly}
          activeOpacity={0.7}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name="trash-outline"
            size={20}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <ThemedText className="text-base font-semibold" style={{ color: "#fff" }}>
            {t("app_settings.clear_cache_only")}
          </ThemedText>
        </HapticButton>

        {/* Option 2: Clear All Data */}
        <HapticButton
          onPress={clearAllData}
          activeOpacity={0.7}
          style={{
            backgroundColor: colors.error,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name="warning-outline"
            size={20}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <ThemedText className="text-base font-semibold" style={{ color: "#fff" }}>
            {t("app_settings.clear_all_data")}
          </ThemedText>
        </HapticButton>

        <View
          className="mt-2 p-3 rounded-xl"
          style={{
            backgroundColor: colors.primary + "10",
          }}
        >
          <View className="flex-row items-center">
            <Ionicons
              name="information-circle"
              size={18}
              color={colors.primary}
              style={{ marginRight: 8 }}
            />
            <ThemedText
              className="text-xs flex-1"
              style={{ color: colors.text, opacity: 0.7 }}
            >
              {t("app_settings.clear_cache_message")}
            </ThemedText>
          </View>
        </View>
      </View>

      <ConfirmationDialog
        visible={dialogState.visible}
        title={dialogState.title}
        message={dialogState.message}
        icon={dialogState.icon}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        destructive={dialogState.destructive}
        loading={dialogState.loading}
        onConfirm={handleConfirm}
        onCancel={hideDialog}
      />
    </CustomBottomSheet>
  );
});

ClearCacheSheet.displayName = "ClearCacheSheet";

export default ClearCacheSheet;

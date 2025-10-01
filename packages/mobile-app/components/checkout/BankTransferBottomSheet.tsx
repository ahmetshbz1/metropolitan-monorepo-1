//  "BankTransferBottomSheet.tsx"
//  metropolitan app

import React, { forwardRef, useCallback, useState } from "react";
import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";

import { ThemedText } from "@/components/ThemedText";
import { HapticIconButton } from "@/components/HapticButton";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useHaptics } from "@/hooks/useHaptics";

type Ref = BottomSheetModal;

export const BankTransferBottomSheet = forwardRef<Ref>((_, ref) => {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { bottom: safeAreaBottom } = useSafeAreaInsets();
  const { triggerHaptic } = useHaptics();
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const bankDetails = [
    {
      label: t("bank_transfer.recipient"),
      value: "METROPOLITAN FOOD GROUP Sp. z o.o.",
    },
    { label: "IBAN (PLN)", value: "PL 12 3456 7890 1234 5678 9012 3456" },
    { label: "IBAN (EUR)", value: "PL 98 7654 3210 9876 5432 1098 7654" },
    { label: t("bank_transfer.bank_name"), value: "Santander Bank polska" },
  ];

  const handleCopyToClipboard = (value: string, label: string) => {
    Clipboard.setStringAsync(value);
    triggerHaptic();
    setCopiedItem(label);
    setTimeout(() => {
      setCopiedItem(null);
    }, 2000);
  };

  const handleClose = useCallback(() => {
    if (ref && "current" in ref) {
      ref.current?.dismiss();
    }
  }, [ref]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    []
  );

  const renderHandle = useCallback(
    () => (
      <View
        className="pb-4 rounded-t-2xl"
        style={{ backgroundColor: colors.cardBackground }}
      >
        <View className="w-10 h-1 rounded-sm bg-gray-300 self-center mt-2.5 mb-3" />
        <ThemedText className="text-xl font-bold text-center px-5">
          {t("bank_transfer.title")}
        </ThemedText>
      </View>
    ),
    [colors, t]
  );

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      enableDismissOnClose
      enablePanDownToClose
      enableContentPanningGesture={false}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
      handleComponent={renderHandle}
      backgroundStyle={{ backgroundColor: colors.cardBackground }}
    >
      <BottomSheetScrollView style={{ paddingBottom: safeAreaBottom || 16 }}>
        <View className="px-5">
          <ThemedText className="text-center opacity-70 text-sm mb-6">
            {t("bank_transfer.subtitle")}
          </ThemedText>

          <View
            className="rounded-2xl p-5 mb-4"
            style={{ backgroundColor: colors.background }}
          >
            <ThemedText className="text-base font-semibold mb-4">
              {t("bank_transfer.account_details")}
            </ThemedText>
            <View className="space-y-4">
              {bankDetails.map((detail, index) => (
                <View key={index}>
                  <ThemedText className="text-sm font-medium opacity-60 mb-1">
                    {detail.label}
                  </ThemedText>
                  <View className="flex-row items-center justify-between">
                    <Text
                      className="text-base font-semibold flex-1"
                      style={{ color: colors.text }}
                      selectable
                    >
                      {detail.value}
                    </Text>
                    <HapticIconButton
                      onPress={() =>
                        handleCopyToClipboard(detail.value, detail.label)
                      }
                      style={{ padding: 8, marginRight: -8 }}
                    >
                      {copiedItem === detail.label ? (
                        <Ionicons
                          name="checkmark-done"
                          size={22}
                          color={colors.success}
                        />
                      ) : (
                        <Ionicons
                          name="copy-outline"
                          size={22}
                          color={colors.textSecondary}
                        />
                      )}
                    </HapticIconButton>
                  </View>
                </View>
              ))}
              <View>
                <ThemedText className="text-sm font-medium opacity-60 mb-1">
                  {t("bank_transfer.description_label")}
                </ThemedText>
                <ThemedText
                  className="text-base font-semibold"
                  style={{ color: colors.danger }}
                >
                  {t("bank_transfer.description_value")}
                </ThemedText>
              </View>
            </View>
          </View>

          <View
            className="rounded-xl p-4 flex-row items-center mb-6"
            style={{ backgroundColor: `${colors.tint}15` }}
          >
            <Ionicons
              name="information-circle-outline"
              size={24}
              color={colors.tint}
            />
            <ThemedText
              className="text-sm ml-3 flex-1 leading-5"
              style={{ color: colors.tint }}
            >
              {t("bank_transfer.info_text")}
            </ThemedText>
          </View>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

BankTransferBottomSheet.displayName = "BankTransferBottomSheet";

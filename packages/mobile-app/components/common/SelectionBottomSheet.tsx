//  "SelectionBottomSheet.tsx"
//  metropolitan app

import React, { forwardRef, useCallback, useMemo } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticButton } from "@/components/HapticButton";
import { ThemedText } from "@/components/ThemedText";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type Ref = BottomSheetModal;

interface SelectionOption {
  label: string;
  icon?: IconName;
  onPress: () => void;
  destructive?: boolean;
}

interface SelectionBottomSheetProps {
  title: string;
  message?: string;
  options: SelectionOption[];
}

export const SelectionBottomSheet = forwardRef<Ref, SelectionBottomSheetProps>(
  ({ title, message, options }, ref) => {
    const { t } = useTranslation();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const { bottom: safeAreaBottom } = useSafeAreaInsets();

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
            {title}
          </ThemedText>
        </View>
      ),
      [title, colors]
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
        <BottomSheetView style={{ paddingBottom: safeAreaBottom || 16 }}>
          <View className="px-5">
            {message && (
              <ThemedText className="text-sm text-center opacity-60 mb-4">
                {message}
              </ThemedText>
            )}

            <View className="gap-3 mb-4">
              {options.map((option, index) => (
                <HapticButton
                  key={index}
                  onPress={() => {
                    option.onPress();
                    handleClose();
                  }}
                  className="py-4 px-4 rounded-xl flex-row items-center"
                  style={{
                    backgroundColor: colors.background,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  {option.icon && (
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{
                        backgroundColor: option.destructive
                          ? `${colors.danger}15`
                          : `${colors.tint}15`,
                      }}
                    >
                      <Ionicons
                        name={option.icon}
                        size={20}
                        color={option.destructive ? colors.danger : colors.tint}
                      />
                    </View>
                  )}
                  <ThemedText
                    className="text-base font-semibold flex-1"
                    style={{
                      color: option.destructive ? colors.danger : colors.text,
                    }}
                  >
                    {option.label}
                  </ThemedText>
                </HapticButton>
              ))}
            </View>

            <HapticButton
              onPress={handleClose}
              className="py-3.5 rounded-xl border items-center justify-center"
              style={{
                borderColor: colors.border,
              }}
            >
              <ThemedText className="font-semibold">
                {t("common.cancel")}
              </ThemedText>
            </HapticButton>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

SelectionBottomSheet.displayName = "SelectionBottomSheet";

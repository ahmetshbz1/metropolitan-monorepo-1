//  "CustomBottomSheet.tsx"
//  metropolitan app
//  Created by Ahmet on 01.07.2025.

import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import React, { forwardRef, useCallback, useMemo } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { HapticIconButton } from "./HapticButton";
import { ThemedText } from "./ThemedText";

type Ref = BottomSheetModal;

// const HEADER_HEIGHT = 80; // Approximate height of the handle and header

export interface Props {
  title: string;
  children: React.ReactNode;
}

const CustomBottomSheet = forwardRef<Ref, Props>(({ title, children }, ref) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  // const [contentHeight, setContentHeight] = useState(0);
  const { bottom: safeAreaBottom } = useSafeAreaInsets();

  // Set a maximum snap point, enableDynamicSizing will adjust to content.
  const snapPoints = useMemo(() => ["90%"], []);

  // const handleContentLayout = useCallback((event: LayoutChangeEvent) => {
  //   const { height } = event.nativeEvent.layout;
  //   setContentHeight(height);
  // }, []);

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
        className="pb-2.5 rounded-t-2xl"
        style={{ backgroundColor: colors.cardBackground }}
      >
        <View className="w-10 h-1 rounded-sm bg-gray-300 self-center mt-2.5 mb-2.5" />
        <View className="flex-row justify-between items-center px-2.5">
          <View className="w-9" />
          <ThemedText className="text-xl font-bold flex-1 text-center">
            {title}
          </ThemedText>
          <HapticIconButton
            onPress={handleClose}
            hapticType="light"
            className="p-1.5"
          >
            <Ionicons name="close-circle" size={26} color={colors.darkGray} />
          </HapticIconButton>
        </View>
      </View>
    ),
    [title, colors, handleClose]
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enableDynamicSizing
      enableDismissOnClose
      backdropComponent={renderBackdrop}
      handleComponent={renderHandle}
      backgroundStyle={{ backgroundColor: colors.cardBackground }}
    >
      <BottomSheetScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: safeAreaBottom || 16 }}
      >
        {children}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

CustomBottomSheet.displayName = "CustomBottomSheet";

export default CustomBottomSheet;

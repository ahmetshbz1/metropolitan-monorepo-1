//  "AgreementModal.tsx"
//  metropolitan app
//  Created by Ahmet on 01.07.2025.

import { ThemedText } from "@/components/ThemedText";
import Colors from "@/constants/Colors";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  NativeScrollEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AgreementModalProps = {
  visible: boolean;
  title: string;
  content: string;
  onAccept: () => void;
  onClose: () => void;
};

export const AgreementModal = ({
  visible,
  title,
  content,
  onAccept,
  onClose,
}: AgreementModalProps) => {
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [scrolledToEnd, setScrolledToEnd] = useState(false);

  const isCloseToBottom = ({
    layoutMeasurement,
    contentOffset,
    contentSize,
  }: NativeScrollEvent) => {
    const paddingToBottom = 20;
    return (
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom
    );
  };

  const handleAccept = () => {
    onAccept();
    onClose();
    setScrolledToEnd(false);
  };

  const handleClose = () => {
    onClose();
    setScrolledToEnd(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <View
        className="flex-1"
        style={{
          backgroundColor: themeColors.background,
          paddingTop: insets.top,
        }}
      >
        <View
          className="p-4 border-b"
          style={{ borderBottomColor: themeColors.border }}
        >
          <ThemedText type="title" className="text-center text-xl">
            {title}
          </ThemedText>
        </View>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
          onScroll={({ nativeEvent }) => {
            if (isCloseToBottom(nativeEvent)) {
              setScrolledToEnd(true);
            }
          }}
          scrollEventThrottle={400}
        >
          <Text
            className="text-base leading-6"
            style={{ color: themeColors.text }}
          >
            {content}
          </Text>
        </ScrollView>
        <View
          className="p-4 border-t"
          style={{
            borderTopColor: themeColors.border,
            paddingBottom: insets.bottom || 16,
          }}
        >
          <TouchableOpacity
            className="py-4 rounded-xl items-center justify-center"
            style={{
              backgroundColor: scrolledToEnd
                ? themeColors.tint
                : themeColors.disabled,
            }}
            onPress={handleAccept}
            disabled={!scrolledToEnd}
          >
            <Text className="text-white text-lg font-semibold">
              {t("terms.modal_accept_button")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="py-4 rounded-xl items-center justify-center mt-2"
            style={{ backgroundColor: themeColors.cardBackground }}
            onPress={handleClose}
          >
            <Text
              className="text-lg font-semibold"
              style={{ color: themeColors.text }}
            >
              {t("terms.modal_close_button")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

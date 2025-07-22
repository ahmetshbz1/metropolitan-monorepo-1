//  "AuthScreenLayout.tsx"
//  metropolitan app
//  Created by Ahmet on 03.07.2025.

import Colors from "@/constants/Colors";
import React from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AuthScreenLayoutProps = {
  children: React.ReactNode;
  disableKeyboardDismiss?: boolean;
  disableKeyboardAvoidingView?: boolean; // Modern klavye yönetimi için (KeyboardAwareScrollView kullanan sayfalar)
};

export const AuthScreenLayout = ({
  children,
  disableKeyboardDismiss = false,
  disableKeyboardAvoidingView = false,
}: AuthScreenLayoutProps) => {
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  const handlePress = () => {
    if (!disableKeyboardDismiss) {
      Keyboard.dismiss();
    }
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: themeColors.background }}
      edges={["left", "right", "bottom"]}
    >
      <TouchableWithoutFeedback onPress={handlePress} accessible={false}>
        <View className="flex-1">
          {disableKeyboardAvoidingView ? (
            children
          ) : (
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              className="flex-1"
              contentContainerStyle={{ flex: 1 }}
            >
              {children}
            </KeyboardAvoidingView>
          )}
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

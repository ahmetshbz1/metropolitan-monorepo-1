//  "_layout.tsx"
//  metropolitan app
//  Created by Ahmet on 17.06.2025.

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Stack } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";

const AuthLayout = () => {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  const headerStyle = {
    backgroundColor: themeColors.background,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
  };

  const headerTitleStyle = {
    color: themeColors.text,
    fontSize: 18,
    fontWeight: "600" as const,
  };

  return (
    <Stack
      screenOptions={{
        headerStyle,
        headerTitleStyle,
        headerTintColor: themeColors.text,
        headerBackTitle: "",
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="phone-login"
        options={{
          title: t("phone_login.title"),
        }}
      />
      <Stack.Screen
        name="otp"
        options={{
          title: t("otp.title"),
        }}
      />
      <Stack.Screen
        name="user-info"
        options={{
          title: t("user_info.title"),
        }}
      />
      <Stack.Screen
        name="terms"
        options={{
          title: t("terms.title"),
        }}
      />
    </Stack>
  );
};

export default AuthLayout;

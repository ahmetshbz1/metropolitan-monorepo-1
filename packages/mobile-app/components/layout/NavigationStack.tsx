//  "NavigationStack.tsx"
//  metropolitan app
//  Created by Ahmet on 14.06.2025.

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Platform } from "react-native";

import {
  DYNAMIC_SCREEN_CONFIGS,
  LAYOUT_CONFIG,
  SCREEN_CONFIGS,
  STATIC_SCREEN_CONFIGS,
} from "@/config/screenConfigs";
import Colors from "@/constants/Colors";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useColorScheme } from "@/hooks/useColorScheme";

export const NavigationStack: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Navigation logic hook
  useAppNavigation();

  const screenOptions = {
    headerStyle: {
      backgroundColor: colors.background,
      ...Platform.select({
        android: LAYOUT_CONFIG.headerStyle.android,
      }),
    },
    headerShadowVisible: LAYOUT_CONFIG.headerOptions.shadowVisible,
    headerTintColor: colors.text,
    headerTitleStyle: {
      ...LAYOUT_CONFIG.headerTitleStyle,
      color: colors.text,
    },
    headerBackTitle: LAYOUT_CONFIG.headerOptions.backTitle,
    headerBackButtonDisplayMode:
      LAYOUT_CONFIG.headerOptions.backButtonDisplayMode,
  };

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={screenOptions}>
        {/* Ana ekranlar */}
        <Stack.Screen
          name={SCREEN_CONFIGS.auth.name}
          options={SCREEN_CONFIGS.auth.options}
        />
        <Stack.Screen
          name={SCREEN_CONFIGS.tabs.name}
          options={SCREEN_CONFIGS.tabs.options}
        />
        <Stack.Screen
          name={SCREEN_CONFIGS.checkout.name}
          options={SCREEN_CONFIGS.checkout.options}
        />
        <Stack.Screen
          name={SCREEN_CONFIGS.notFound.name}
          options={SCREEN_CONFIGS.notFound.options}
        />

        {/* Dinamik ekranlar */}
        {DYNAMIC_SCREEN_CONFIGS.map((screen) => (
          <Stack.Screen
            key={screen.name}
            name={screen.name}
            options={
              typeof screen.options === "function"
                ? (props) => ({
                    ...screen.options(props),
                    headerStyle: {
                      backgroundColor: colors.background,
                    },
                    headerTintColor: colors.text,
                  })
                : screen.options
            }
          />
        ))}

        {/* Statik ekranlar */}
        {STATIC_SCREEN_CONFIGS.map((screen) => (
          <Stack.Screen
            key={screen.name}
            name={screen.name}
            options={screen.options}
          />
        ))}
      </Stack>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
};

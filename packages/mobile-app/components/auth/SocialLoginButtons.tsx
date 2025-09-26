//  "SocialLoginButtons.tsx"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import React, { useState } from "react";
import { Platform, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import * as Haptics from "expo-haptics";

const GoogleIcon = () => (
  <Svg height={26} width={26} viewBox="0 0 24 24">
    <Path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <Path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <Path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      fill="#FBBC05"
    />
    <Path
      d="M12 5.48c1.63 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.43 6.16-4.43z"
      fill="#EA4335"
    />
  </Svg>
);

interface SocialLoginButtonsProps {
  themeColors: any;
  colorScheme: "light" | "dark" | null;
  onLayout?: (height: number) => void;
}

export const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  themeColors,
  colorScheme,
  onLayout,
}) => {
  const { t } = useTranslation();
  const { signInWithApple, signInWithGoogle, isAppleSignInAvailable } = useAuth();
  const [loading, setLoading] = useState<"apple" | "google" | null>(null);

  const handleAppleSignIn = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading("apple");
    try {
      const result = await signInWithApple();
      if (!result.success) {
        // Removed console statement
      }
    } finally {
      setLoading(null);
    }
  };

  const handleGoogleSignIn = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading("google");
    try {
      const result = await signInWithGoogle();
      if (!result.success) {
        // Removed console statement
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <View
      onLayout={(e) => onLayout?.(e.nativeEvent.layout.height)}
    >
      <Text
        className="my-5 text-sm text-center self-center"
        style={{ color: themeColors.mediumGray }}
      >
        {t("login.social_separator")}
      </Text>

      <View className="flex-row gap-4 self-center justify-center">
        {Platform.OS === "ios" && isAppleSignInAvailable && (
          <TouchableOpacity
            onPress={handleAppleSignIn}
            disabled={loading !== null}
            className="rounded-full w-14 h-14 items-center justify-center shadow-sm"
            style={{
              backgroundColor:
                colorScheme === "dark" ? "#FFFFFF" : "#000000",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2.22,
              elevation: 3,
              opacity: loading !== null && loading !== "apple" ? 0.5 : 1,
            }}
          >
            {loading === "apple" ? (
              <ActivityIndicator color={colorScheme === "dark" ? "#000000" : "white"} size="small" />
            ) : (
              <Ionicons
                name="logo-apple"
                size={26}
                color={colorScheme === "dark" ? "#000000" : "white"}
              />
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={loading !== null}
          className="rounded-full w-14 h-14 items-center justify-center shadow-sm"
          style={{
            backgroundColor: themeColors.cardBackground,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2.22,
            elevation: 3,
            opacity: loading !== null && loading !== "google" ? 0.5 : 1,
          }}
        >
          {loading === "google" ? (
            <ActivityIndicator color="#4285F4" size="small" />
          ) : (
            <GoogleIcon />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};
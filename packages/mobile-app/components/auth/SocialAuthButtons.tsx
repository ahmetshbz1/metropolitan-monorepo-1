import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Platform, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";

export const SocialAuthButtons = () => {
  const { signInWithApple, signInWithGoogle, isAppleSignInAvailable } = useAuth();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = {
    text: isDark ? '#FFFFFF' : '#000000',
    border: isDark ? '#374151' : '#E5E7EB',
    cardBackground: isDark ? '#1F2937' : '#FFFFFF',
  };
  const [loading, setLoading] = React.useState<"apple" | "google" | null>(null);

  const handleAppleSignIn = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading("apple");
    try {
      const result = await signInWithApple();
      if (!result.success) {
        console.error("Apple Sign-In hatası:", result.error);
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
        console.error("Google Sign-In hatası:", result.error);
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <View className="mt-6">
      <View className="flex-row items-center mb-4">
        <View className="flex-1 h-px bg-gray-300" />
        <Text className="mx-3 text-gray-500 text-sm">{t("auth.or_continue_with")}</Text>
        <View className="flex-1 h-px bg-gray-300" />
      </View>

      <View className="space-y-3">
        {Platform.OS === "ios" && isAppleSignInAvailable && (
          <TouchableOpacity
            onPress={handleAppleSignIn}
            disabled={loading !== null}
            className="flex-row items-center justify-center py-3 px-4 rounded-xl bg-black"
            style={{
              opacity: loading !== null && loading !== "apple" ? 0.5 : 1,
            }}
          >
            {loading === "apple" ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="logo-apple" size={20} color="white" />
                <Text className="ml-2 text-white font-semibold">
                  {t("auth.continue_with_apple")}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={loading !== null}
          className="flex-row items-center justify-center py-3 px-4 rounded-xl border"
          style={{
            borderColor: colors.border,
            backgroundColor: colors.cardBackground,
            opacity: loading !== null && loading !== "google" ? 0.5 : 1,
          }}
        >
          {loading === "google" ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="#4285F4" />
              <Text className="ml-2 font-semibold" style={{ color: colors.text }}>
                {t("auth.continue_with_google")}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};
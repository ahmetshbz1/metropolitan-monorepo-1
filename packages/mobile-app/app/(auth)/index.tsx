//  "index.tsx"
//  metropolitan app
//  Created by Ahmet on 04.06.2025.

import { BaseButton } from "@/components/base/BaseButton";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useHaptics } from "@/hooks/useHaptics";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  Platform,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { ClipPath, Defs, Image, Path } from "react-native-svg";

const { width } = Dimensions.get("window");
const imageHeight = width * 1;
const curveHeight = 20;

const CustomClipPath = () => (
  <Defs>
    <ClipPath id="clip">
      <Path
        d={`M0,0 H${width} V${imageHeight - curveHeight} C${width * 0.7},${imageHeight} ${
          width * 0.3
        },${imageHeight} 0,${imageHeight - curveHeight} Z`}
      />
    </ClipPath>
  </Defs>
);

const GoogleIcon = ({ size }: { size: number }) => (
  <Svg height={size} width={size} viewBox="0 0 24 24">
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

const LoginScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { from } = useLocalSearchParams();
  const { loginAsGuest } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { withHapticFeedback } = useHaptics(); // Haptic yetenekleri
  const [loginType, setLoginType] = useState<"b2b" | "b2c">("b2c"); // NOTE: Kullanıcı girişi türünü seçmek için durum
  const [socialSectionHeight, setSocialSectionHeight] = useState<number>(0); // Sosyal bölüm yüksekliği

  // Buton animasyon değerleri
  const b2bScale = useSharedValue(loginType === "b2b" ? 1.05 : 1);
  const b2cScale = useSharedValue(loginType === "b2c" ? 1.05 : 1);

  // Buton animasyon stilleri
  const b2bAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: b2bScale.value }],
  }));

  const b2cAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: b2cScale.value }],
  }));

  const handleLoginTypeChange = (type: "b2b" | "b2c") => {
    setLoginType(type);

    // Buton animasyonları
    if (type === "b2b") {
      b2bScale.value = withTiming(1.05, { duration: 200 });
      b2cScale.value = withTiming(1, { duration: 200 });
    } else {
      b2cScale.value = withTiming(1.05, { duration: 200 });
      b2bScale.value = withTiming(1, { duration: 200 });
    }
  };

  const handleGuestLogin = async () => {
    await loginAsGuest();
    router.replace("/(tabs)");
  };

  // Ekran genişliğine orantılı başlık boyutu (min 22, max 30)
  const { width: winWidth } = useWindowDimensions();
  const titleFontSize = Math.max(24, Math.min(34, winWidth * 0.07));
  const subtitleFontSize = titleFontSize * 0.55; // Alt başlık orantılı

  // Checkout'tan gelme durumu
  const isFromCheckout = from === "checkout";

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: themeColors.background }}
    >
      <View style={{ height: imageHeight }} className="w-full">
        <Svg width={width} height={imageHeight}>
          <CustomClipPath />
          <Image
            href={require("@/assets/images/yayla.webp")}
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#clip)"
          />
        </Svg>
      </View>
      <View className="flex-1 justify-between px-6 pt-4">
        <View>
          <Text
            className="font-bold text-center mb-2"
            style={{ color: themeColors.text, fontSize: titleFontSize }}
          >
            {isFromCheckout
              ? t("login.checkout_title")
              : t("login.welcome_title")}
          </Text>
          <Text
            className="text-base text-center self-center"
            style={{
              color: themeColors.mediumGray,
              maxWidth: "90%",
              fontSize: subtitleFontSize,
            }}
          >
            {isFromCheckout
              ? t("login.checkout_subtitle")
              : t("login.welcome_subtitle")}
          </Text>
          <View className="flex-row justify-center gap-3 mt-4">
            {(["b2b", "b2c"] as const).map((type) => {
              const isSelected = loginType === type;
              return (
                <Animated.View
                  key={type}
                  style={type === "b2b" ? b2bAnimatedStyle : b2cAnimatedStyle}
                >
                  <TouchableOpacity
                    onPress={withHapticFeedback(
                      () => handleLoginTypeChange(type),
                      "light"
                    )}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 24,
                      borderRadius: 24,
                      backgroundColor: isSelected
                        ? themeColors.tint
                        : "transparent",
                      borderWidth: 1,
                      borderColor: themeColors.tint,
                      shadowColor: isSelected
                        ? themeColors.tint
                        : "transparent",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isSelected ? 0.3 : 0,
                      shadowRadius: 4,
                      elevation: isSelected ? 4 : 0,
                    }}
                  >
                    <Text
                      style={{
                        color: isSelected ? "#ffffff" : themeColors.tint,
                        fontWeight: "600",
                        fontSize: 16,
                      }}
                    >
                      {t(`login.${type}`)}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </View>

        <View
          className="items-center"
          style={{ paddingBottom: insets.bottom || 20 }}
        >
          <BaseButton
            variant="primary"
            size="medium"
            fullWidth
            onPress={withHapticFeedback(
              () =>
                router.push({
                  pathname: "/(auth)/phone-login",
                  params: { type: loginType },
                } as any),
              "light"
            )}
            style={{ marginBottom: 20 }}
          >
            <View className="flex-row items-center">
              <Ionicons name="call-outline" size={22} color="white" />
              <Text className="text-white text-lg font-semibold ml-2">
                {t("login.phone_button")}
              </Text>
            </View>
          </BaseButton>

          {loginType === "b2c" ? (
            <View
              onLayout={(e) =>
                setSocialSectionHeight(e.nativeEvent.layout.height)
              }
            >
              <Text
                className="my-5 text-sm text-center self-center"
                style={{ color: themeColors.mediumGray }}
              >
                {t("login.social_separator")}
              </Text>

              <View className="flex-row gap-4 self-center justify-center">
                {Platform.OS === "ios" && (
                  <TouchableOpacity
                    className="rounded-full w-14 h-14 items-center justify-center shadow-sm"
                    style={{
                      backgroundColor:
                        colorScheme === "dark" ? "#FFFFFF" : "#000000",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2.22,
                      elevation: 3,
                    }}
                  >
                    <Ionicons
                      name="logo-apple"
                      size={26}
                      color={colorScheme === "dark" ? "#000000" : "white"}
                    />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  className="rounded-full w-14 h-14 items-center justify-center shadow-sm"
                  style={{
                    backgroundColor: themeColors.cardBackground,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2.22,
                    elevation: 3,
                  }}
                >
                  <GoogleIcon size={28} />
                </TouchableOpacity>
                <TouchableOpacity
                  className="rounded-full w-14 h-14 items-center justify-center shadow-sm"
                  style={{
                    backgroundColor: themeColors.cardBackground,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2.22,
                    elevation: 3,
                  }}
                >
                  <Ionicons name="logo-facebook" size={28} color={"#1877F2"} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // B2B modunda sosyal medya bölümü yerine bilgilendirici metin göster
            <View
              style={{
                justifyContent: "center",
                alignItems: "center",
                ...(socialSectionHeight
                  ? { height: socialSectionHeight }
                  : { paddingVertical: 24 }),
              }}
            >
              <Text
                className="text-sm text-center"
                style={{
                  color: themeColors.mediumGray,
                  maxWidth: "80%",
                  fontSize: subtitleFontSize,
                }}
              >
                {t("login.b2b_note")}
              </Text>
            </View>
          )}

          <BaseButton
            variant="text"
            size="medium"
            title={t("login.guest_button")}
            onPress={withHapticFeedback(handleGuestLogin, "light")}
            style={{ marginTop: 24 }}
          />
        </View>
      </View>
    </View>
  );
};

export default LoginScreen;

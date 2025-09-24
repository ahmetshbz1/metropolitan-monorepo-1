// "legal.tsx"
// metropolitan app
// Legal page

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View, Linking, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticButton } from "@/components/HapticButton";

export default function LegalScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const currentLang = i18n.language || 'tr';

  // Header title'ı dinamik olarak ayarla
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("legal.title"),
    });
  }, [navigation, t]);

  const handleWebViewPress = (urlPath: string, title: string) => {
    const url = `https://metropolitanfg.pl/${urlPath}?lang=${currentLang}`;
    router.push(`/legal-webview?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`);
  };

  const handleGetDirections = () => {
    const address = "Aleja Krakowska 44, 05-090 Janki, Warsaw, Poland";
    const encodedAddress = encodeURIComponent(address);

    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q='
    });

    const url = Platform.select({
      ios: `${scheme}${encodedAddress}`,
      android: `${scheme}${encodedAddress}`
    });

    if (url) {
      Linking.openURL(url).catch(err => {
        // Fallback to Google Maps web URL
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`);
      });
    }
  };

  const legalItems = [
    {
      id: "terms",
      title: t("legal.terms_of_service"),
      subtitle: t("legal.terms_desc"),
      icon: "document-text-outline" as const,
      onPress: () => handleWebViewPress("terms-of-service", t("legal.terms_of_service")),
    },
    {
      id: "privacy",
      title: t("legal.privacy_policy"),
      subtitle: t("legal.privacy_desc"),
      icon: "shield-checkmark-outline" as const,
      onPress: () => handleWebViewPress("privacy-policy", t("legal.privacy_policy")),
    },
    {
      id: "cookie",
      title: t("legal.cookie_policy"),
      subtitle: t("legal.cookie_desc"),
      icon: "browsers-outline" as const,
      onPress: () => handleWebViewPress("cookie-policy", t("legal.cookie_policy")),
    },
  ];

  const companyInfo = {
    name: "Metropolitan Food Group Sp. z o.o.",
    address: "ul. Aleja Krakowska 44\n05-090 Janki, Warsaw",
    nip: "NIP: 123 456 78 90",
    krs: "KRS: 0000317933",
    regon: "REGON: 123456789",
    email: "info@metropolitanfg.pl",
    phone: "+48 600 790 035",
  };

  return (
    <ThemedView className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: insets.bottom + 16,
        }}
      >
        {/* Legal Documents */}
        <View className="px-4 mb-6">
          <ThemedText className="text-sm font-semibold mb-3 opacity-60 uppercase">
            {t("legal.documents_section")}
          </ThemedText>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 18,
              overflow: "hidden",
            }}
          >
            {legalItems.map((item, index) => (
              <HapticButton
                key={item.id}
                onPress={item.onPress}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  borderBottomWidth: index < legalItems.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.primary + "15",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Ionicons name={item.icon} size={20} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <ThemedText className="text-base font-medium">
                    {item.title}
                  </ThemedText>
                  <ThemedText className="text-xs opacity-60 mt-1">
                    {item.subtitle}
                  </ThemedText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.mediumGray}
                />
              </HapticButton>
            ))}
          </View>
        </View>

        {/* Company Information */}
        <View className="px-4 mb-6">
          <ThemedText className="text-sm font-semibold mb-3 opacity-60 uppercase">
            {t("legal.company_info_section")}
          </ThemedText>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 18,
              padding: 16,
            }}
          >
            <View className="mb-4">
              <ThemedText className="text-lg font-bold mb-2">
                {companyInfo.name}
              </ThemedText>
              <View className="flex-row items-center justify-between">
                <ThemedText className="text-sm opacity-70 flex-1 mr-2">
                  {companyInfo.address}
                </ThemedText>
                <HapticButton
                  onPress={handleGetDirections}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.primary + "15",
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 12,
                  }}
                >
                  <Ionicons name="navigate" size={16} color={colors.primary} />
                  <ThemedText
                    className="text-xs font-medium ml-1"
                    style={{ color: colors.primary }}
                  >
                    {t("legal.get_directions")}
                  </ThemedText>
                </HapticButton>
              </View>
            </View>

            <View className="space-y-3">
              <View className="flex-row items-center">
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors.primary + "15",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                  }}
                >
                  <Ionicons name="business-outline" size={16} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <ThemedText className="text-xs opacity-60">
                    NIP
                  </ThemedText>
                  <ThemedText className="text-sm font-medium">
                    {companyInfo.nip}
                  </ThemedText>
                </View>
              </View>

              <View className="flex-row items-center">
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors.primary + "15",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                  }}
                >
                  <Ionicons name="document-outline" size={16} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <ThemedText className="text-xs opacity-60">
                    KRS
                  </ThemedText>
                  <ThemedText className="text-sm font-medium">
                    {companyInfo.krs}
                  </ThemedText>
                </View>
              </View>

              <View className="flex-row items-center">
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors.primary + "15",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                  }}
                >
                  <Ionicons name="card-outline" size={16} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <ThemedText className="text-xs opacity-60">
                    REGON
                  </ThemedText>
                  <ThemedText className="text-sm font-medium">
                    {companyInfo.regon}
                  </ThemedText>
                </View>
              </View>

              <View className="flex-row items-center">
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors.primary + "15",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                  }}
                >
                  <Ionicons name="mail-outline" size={16} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <ThemedText className="text-xs opacity-60">
                    {t("legal.email")}
                  </ThemedText>
                  <ThemedText className="text-sm font-medium">
                    {companyInfo.email}
                  </ThemedText>
                </View>
              </View>

              <View className="flex-row items-center">
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors.primary + "15",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                  }}
                >
                  <Ionicons name="call-outline" size={16} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <ThemedText className="text-xs opacity-60">
                    {t("legal.phone")}
                  </ThemedText>
                  <ThemedText className="text-sm font-medium">
                    {companyInfo.phone}
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Legal Notice */}
        <View className="px-4 mb-6">
          <View
            style={{
              padding: 16,
              backgroundColor: colors.primary + "10",
              borderRadius: 18,
              borderWidth: 1,
              borderColor: colors.primary + "20",
            }}
          >
            <View className="flex-row items-center mb-3">
              <Ionicons
                name="information-circle"
                size={24}
                color={colors.primary}
              />
              <ThemedText className="text-base font-semibold ml-2">
                {t("legal.notice_title")}
              </ThemedText>
            </View>
            <ThemedText className="text-sm opacity-70">
              {t("legal.notice_desc")}
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}
// "support.tsx"
// metropolitan app
// Support page

import { HapticButton } from "@/components/HapticButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { Linking, ScrollView, View, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SupportScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  // Header title'ı dinamik olarak ayarla
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("support.title"),
    });
  }, [navigation, t]);

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

  const contactMethods = [
    {
      id: "whatsapp",
      title: t("support.whatsapp"),
      subtitle: "+48 600 790 035",
      icon: "whatsapp" as const,
      color: "#25D366",
      action: () =>
        Linking.openURL(
          `whatsapp://send?phone=48600790035&text=${encodeURIComponent(t("support.whatsapp_message"))}`
        ),
    },
    {
      id: "phone",
      title: t("support.call_us"),
      subtitle: "+48 600 790 035",
      icon: "phone" as const,
      color: colors.primary,
      action: () => Linking.openURL("tel:+48600790035"),
    },
    {
      id: "email",
      title: t("support.email"),
      subtitle: "info@metropolitanfg.pl",
      icon: "email" as const,
      color: colors.primary,
      action: () => Linking.openURL("mailto:info@metropolitanfg.pl"),
    },
    {
      id: "address",
      title: t("support.address"),
      subtitle: "Aleja Krakowska 44, 05-090 Janki",
      icon: "location" as const,
      color: colors.primary,
      action: handleGetDirections,
    },
  ];

  const socialMethods = [
    {
      id: "instagram",
      title: t("support.instagram"),
      subtitle: "@metropolitanfg",
      icon: "instagram" as const,
      color: "#E4405F",
      action: () => Linking.openURL("https://instagram.com/metropolitanfg"),
    },
    {
      id: "facebook",
      title: t("support.facebook"),
      subtitle: "Metropolitan Food Group",
      icon: "facebook" as const,
      color: "#1877F2",
      action: () => Linking.openURL("https://facebook.com/metropolitanfg"),
    },
    {
      id: "twitter",
      title: t("support.twitter"),
      subtitle: "@metropolitanfg",
      icon: "twitter" as const,
      color: "#1DA1F2",
      action: () => Linking.openURL("https://twitter.com/metropolitanfg"),
    },
    {
      id: "linkedin",
      title: t("support.linkedin"),
      subtitle: "Metropolitan Food Group",
      icon: "linkedin" as const,
      color: "#0A66C2",
      action: () =>
        Linking.openURL("https://linkedin.com/company/metropolitanfg"),
    },
  ];

  const faqItems = [
    {
      id: "delivery",
      question: t("support.faq.delivery_question"),
      answer: t("support.faq.delivery_answer"),
    },
    {
      id: "payment",
      question: t("support.faq.payment_question"),
      answer: t("support.faq.payment_answer"),
    },
    {
      id: "return",
      question: t("support.faq.return_question"),
      answer: t("support.faq.return_answer"),
    },
    {
      id: "cancel",
      question: t("support.faq.cancel_question"),
      answer: t("support.faq.cancel_answer"),
    },
  ];

  const [expandedFaq, setExpandedFaq] = React.useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
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
        {/* Contact Section */}
        <View className="px-4 mb-6">
          <ThemedText className="text-sm font-semibold mb-3 opacity-60 uppercase">
            {t("support.contact_section")}
          </ThemedText>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 18,
              overflow: "hidden",
            }}
          >
            {contactMethods.map((method, index) => (
              <HapticButton
                key={method.id}
                onPress={method.action}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  borderBottomWidth: index < contactMethods.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: method.color + "20",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  {method.icon === "whatsapp" ? (
                    <MaterialCommunityIcons
                      name="whatsapp"
                      size={22}
                      color={method.color}
                    />
                  ) : method.icon === "phone" ? (
                    <Ionicons name="call" size={20} color={method.color} />
                  ) : method.icon === "location" ? (
                    <Ionicons name="location" size={20} color={method.color} />
                  ) : (
                    <Ionicons name="mail" size={20} color={method.color} />
                  )}
                </View>
                <View className="flex-1">
                  <ThemedText className="text-base font-medium">
                    {method.title}
                  </ThemedText>
                  <ThemedText className="text-xs opacity-60 mt-1">
                    {method.subtitle}
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

        {/* Social Media Section */}
        <View className="px-4 mb-6">
          <ThemedText className="text-sm font-semibold mb-3 opacity-60 uppercase">
            {t("support.social_section")}
          </ThemedText>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 18,
              overflow: "hidden",
            }}
          >
            {socialMethods.map((method, index) => (
              <HapticButton
                key={method.id}
                onPress={method.action}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  borderBottomWidth: index < socialMethods.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: method.color + "20",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <MaterialCommunityIcons
                    name={method.icon as any}
                    size={22}
                    color={method.color}
                  />
                </View>
                <View className="flex-1">
                  <ThemedText className="text-base font-medium">
                    {method.title}
                  </ThemedText>
                  <ThemedText className="text-xs opacity-60 mt-1">
                    {method.subtitle}
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

        {/* FAQ Section */}
        <View className="px-4 mb-6">
          <ThemedText className="text-sm font-semibold mb-3 opacity-60 uppercase">
            {t("support.faq_section")}
          </ThemedText>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 18,
              overflow: "hidden",
            }}
          >
            {faqItems.map((item, index) => (
              <View key={item.id}>
                <HapticButton
                  onPress={() => toggleFaq(item.id)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 16,
                    borderBottomWidth:
                      expandedFaq !== item.id && index < faqItems.length - 1
                        ? 1
                        : 0,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View className="flex-1">
                    <ThemedText className="text-base font-medium">
                      {item.question}
                    </ThemedText>
                  </View>
                  <Ionicons
                    name={
                      expandedFaq === item.id ? "chevron-up" : "chevron-down"
                    }
                    size={20}
                    color={colors.mediumGray}
                  />
                </HapticButton>
                {expandedFaq === item.id && (
                  <View
                    style={{
                      paddingHorizontal: 16,
                      paddingBottom: 16,
                      borderBottomWidth: index < faqItems.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <ThemedText className="text-sm opacity-70">
                      {item.answer}
                    </ThemedText>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Help Center Info */}
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
                {t("support.help_center")}
              </ThemedText>
            </View>
            <ThemedText className="text-sm opacity-70">
              {t("support.help_center_desc")}
            </ThemedText>
            <ThemedText className="text-sm font-medium mt-3">
              {t("support.working_hours")}
            </ThemedText>
            <ThemedText className="text-sm opacity-70 mt-1">
              {t("support.working_hours_weekdays")}
            </ThemedText>
            <ThemedText className="text-sm opacity-70">
              {t("support.working_hours_weekend")}
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

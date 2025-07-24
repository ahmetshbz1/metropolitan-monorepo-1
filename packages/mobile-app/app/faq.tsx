//  "faq.tsx"
//  metropolitan app
//  Created by Ahmet on 01.07.2025.

import { useNavigation } from "expo-router";
import React, { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";

import { Collapsible } from "@/components/Collapsible";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function FaqScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  // Header title'ı dinamik olarak ayarla
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("faq.title"),
    });
  }, [navigation, t]);

  const FAQ_DATA = [
    {
      question: t("faq.q1.question"),
      answer: t("faq.q1.answer"),
    },
    {
      question: t("faq.q2.question"),
      answer: t("faq.q2.answer"),
    },
    {
      question: t("faq.q3.question"),
      answer: t("faq.q3.answer"),
    },
    {
      question: t("faq.q4.question"),
      answer: t("faq.q4.answer"),
    },
  ];

  return (
    <ThemedView className="flex-1">
      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {FAQ_DATA.map((item, index) => (
          <View
            key={index}
            className="py-4"
            style={{
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.border,
            }}
          >
            <Collapsible title={item.question}>
              <ThemedText className="leading-6 mt-2" style={{ color: "#555" }}>
                {item.answer}
              </ThemedText>
            </Collapsible>
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

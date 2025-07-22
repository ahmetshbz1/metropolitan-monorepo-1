//  "+not-found.tsx"
//  metropolitan app
//  Created by Ahmet on 28.06.2025.

import { Link, Stack } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

export default function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t("not_found.title") }} />
      <ThemedView className="flex-1 items-center justify-center p-5">
        <ThemedText type="title">{t("not_found.description")}</ThemedText>
        <Link href="/" className="mt-4 py-4">
          <ThemedText type="link">{t("not_found.go_home")}</ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}

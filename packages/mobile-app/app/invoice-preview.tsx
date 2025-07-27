//  "invoice-preview.tsx"
//  metropolitan app
//  Created by Ahmet on 09.06.2025. Updated on 20.07.2025.

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";

import { PdfPageIndicator } from "@/components/pdf/PdfPageIndicator";
import { PdfViewer } from "@/components/pdf/PdfViewer";
import { PdfDownloadButton } from "@/components/pdf/PdfDownloadButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { usePdfLoader } from "@/hooks/pdf/usePdfLoader";
import { usePdfDownload } from "@/hooks/pdf/usePdfDownload";

export default function InvoicePreviewPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  // PDF loading logic
  const {
    pdfData,
    loading,
    currentPage,
    totalPages,
    handleLoadComplete,
    handlePageChanged,
    handleError,
  } = usePdfLoader(id);

  // PDF download logic
  const { downloading, downloadAndShare } = usePdfDownload();

  // Header title'ı dinamik olarak ayarla
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("invoice_preview.title"),
    });
  }, [navigation, t]);

  const handleDownload = async () => {
    if (!pdfData || !id) return;

    const fileName = `fatura-${pdfData.orderNumber || id}.pdf`;
    const shareTitle = t("invoice_preview.share_title", {
      orderNumber: pdfData.orderNumber || id,
    });

    await downloadAndShare(pdfData.base64, fileName, shareTitle);
  };

  if (loading) {
    return (
      <ThemedView className="flex-1">
        <View className="flex-1 justify-center items-center gap-4">
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText className="text-base opacity-70">
            {t("invoice_preview.loading")}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!pdfData?.source) {
    return (
      <ThemedView className="flex-1">
        <View className="flex-1 justify-center items-center gap-4 p-8">
          <Ionicons
            name="document-outline"
            size={64}
            color={colors.mediumGray}
          />
          <ThemedText className="text-base opacity-70 text-center">
            {t("invoice_preview.error")}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <View className="flex-1" style={{ backgroundColor: "#f5f5f5" }}>
        <PdfPageIndicator currentPage={currentPage} totalPages={totalPages} />
        
        <PdfViewer
          source={pdfData.source}
          onLoadComplete={handleLoadComplete}
          onPageChanged={handlePageChanged}
          onError={handleError}
          colors={colors}
        />
      </View>

      <PdfDownloadButton
        onPress={handleDownload}
        downloading={downloading}
        colors={colors}
      />
    </ThemedView>
  );
}

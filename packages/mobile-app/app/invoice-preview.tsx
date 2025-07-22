//  "invoice-preview.tsx"
//  metropolitan app
//  Created by Ahmet on 09.06.2025. Updated on 20.07.2025.

import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import * as Sharing from "expo-sharing";

import React, { useEffect, useState, useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";
import Pdf from "react-native-pdf";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticButton } from "@/components/HapticButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { api } from "@/core/api";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useToast } from "@/hooks/useToast";

export default function InvoicePreviewPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { showToast } = useToast();
  const safeAreaInsets = useSafeAreaInsets();
  const [pdfSource, setPdfSource] = useState<any>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Header title'ı dinamik olarak ayarla
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("invoice_preview.title"),
    });
  }, [navigation, t]);

  useEffect(() => {
    if (id) {
      loadPdfPreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadPdfPreview = async () => {
    if (!id) return;

    setLoading(true);
    try {
      // API'den PDF'i indir
      const response = await api.get(`/invoices/${id}/download`, {
        responseType: "blob",
      });

      if (response.status === 200) {
        // Base64'e çevir
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result?.toString();
            if (result) {
              const base64 = result.split(",")[1];
              resolve(base64 || "");
            } else {
              resolve("");
            }
          };
          reader.readAsDataURL(response.data);
        });

        setPdfBase64(base64Data);

        // PDF source'u react-native-pdf için ayarla
        setPdfSource({
          uri: `data:application/pdf;base64,${base64Data}`,
          cache: true,
        });

        // Order number'ı response header'dan al (eğer varsa)
        const contentDisposition = response.headers["content-disposition"];
        if (contentDisposition) {
          const match = contentDisposition.match(/fatura-(.+)\.pdf/);
          if (match) {
            setOrderNumber(match[1]);
          }
        }
      }
    } catch (error: any) {
      console.error("PDF preview error:", error);

      if (error.response?.status === 401) {
        showToast(t("auth.login_required"), "error");
      } else if (error.response?.status === 404) {
        showToast(t("order_detail.actions.invoice_not_found"), "error");
      } else {
        showToast(t("invoice_preview.load_error"), "error");
      }
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const downloadAndShare = async () => {
    if (!pdfBase64 || !id) return;

    setDownloading(true);
    try {
      // Kalıcı dosya oluştur
      const fileName = `fatura-${orderNumber || id}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      // Base64'i dosyaya kaydet
      await FileSystem.writeAsStringAsync(fileUri, pdfBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Dosyayı paylaş
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/pdf",
          dialogTitle: t("invoice_preview.share_title", {
            orderNumber: orderNumber || id,
          }),
        });
      } else {
        showToast(
          t("order_detail.actions.invoice_downloaded", { fileName }),
          "success"
        );
      }
    } catch (error) {
      console.error("Download error:", error);
      showToast(
        t("order_detail.actions.invoice_download_error"),
        "error"
      );
    } finally {
      setDownloading(false);
    }
  };

  // PDF yükleme olayları
  const handleLoadComplete = (numberOfPages: number) => {
    console.log(`PDF yüklendi: ${numberOfPages} sayfa`);
    setTotalPages(numberOfPages);
    setLoading(false);
  };

  const handlePageChanged = (page: number) => {
    setCurrentPage(page);
  };

  const handleError = (error: any) => {
    console.error("PDF yükleme hatası:", error);
    setLoading(false);
    showToast(t("invoice_preview.load_error"), "error");
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

  if (!pdfSource) {
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
        {/* PDF sayfa bilgisi */}
        {totalPages > 0 && (
          <View className="absolute top-12 left-4 z-10">
            <View
              className="px-3 py-2 rounded-lg"
              style={{
                backgroundColor: "white",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <ThemedText
                className="text-sm font-medium"
                style={{ color: "black" }}
              >
                {currentPage} / {totalPages}
              </ThemedText>
            </View>
          </View>
        )}

        <Pdf
          source={pdfSource}
          onLoadComplete={handleLoadComplete}
          onPageChanged={handlePageChanged}
          onError={handleError}
          onPressLink={(uri) => {
            console.log(`Link tıklandı: ${uri}`);
          }}
          style={{
            flex: 1,
            backgroundColor: "transparent",
          }}
          trustAllCerts={false}
          enablePaging={true}
          enableAnnotationRendering={true}
          spacing={10}
          minScale={1}
          maxScale={3.0}
          scale={1.0}
          horizontal={false}
          enableDoubleTapZoom={true}
          fitPolicy={0} // 0: FitWidth, 1: FitHeight, 2: FitBoth
          renderActivityIndicator={() => (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color={colors.tint} />
              <ThemedText className="text-base opacity-70 mt-2">
                {t("invoice_preview.loading")}
              </ThemedText>
            </View>
          )}
        />
      </View>

      {/* Floating Action Button */}
      <View
        className="absolute right-6"
        style={{ bottom: safeAreaInsets.bottom + 24 }}
      >
        <HapticButton
          onPress={downloadAndShare}
          isLoading={downloading}
          disabled={downloading}
          hapticType="medium"
          className="w-14 h-14 rounded-full justify-center items-center"
          style={{
            backgroundColor: colors.tint,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Ionicons
            name={downloading ? "download" : "download-outline"}
            size={24}
            color="white"
          />
        </HapticButton>
      </View>
    </ThemedView>
  );
}

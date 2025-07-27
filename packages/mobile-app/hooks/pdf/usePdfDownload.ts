//  "usePdfDownload.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import { useState } from "react";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/useToast";

export const usePdfDownload = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const downloadAndShare = async (
    pdfBase64: string,
    fileName: string,
    shareTitle?: string
  ) => {
    if (!pdfBase64) return;

    setDownloading(true);
    try {
      // Kalıcı dosya oluştur
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      // Base64'i dosyaya kaydet
      await FileSystem.writeAsStringAsync(fileUri, pdfBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Dosyayı paylaş
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/pdf",
          dialogTitle: shareTitle || fileName,
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

  return {
    downloading,
    downloadAndShare,
  };
};
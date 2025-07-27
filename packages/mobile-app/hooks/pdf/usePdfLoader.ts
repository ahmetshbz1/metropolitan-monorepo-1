//  "usePdfLoader.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { api } from "@/core/api";
import { useToast } from "@/hooks/useToast";

interface PdfData {
  source: any;
  base64: string;
  orderNumber: string;
}

export const usePdfLoader = (invoiceId: string | undefined) => {
  const router = useRouter();
  const { t } = useTranslation();
  const { showToast } = useToast();
  
  const [pdfData, setPdfData] = useState<PdfData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (invoiceId) {
      loadPdfPreview();
    }
  }, [invoiceId]);

  const loadPdfPreview = async () => {
    if (!invoiceId) return;

    setLoading(true);
    try {
      // API'den PDF'i indir
      const response = await api.get(`/invoices/${invoiceId}/download`, {
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

        // Order number'ı response header'dan al (eğer varsa)
        let orderNumber = invoiceId;
        const contentDisposition = response.headers["content-disposition"];
        if (contentDisposition) {
          const match = contentDisposition.match(/fatura-(.+)\.pdf/);
          if (match) {
            orderNumber = match[1];
          }
        }

        setPdfData({
          source: {
            uri: `data:application/pdf;base64,${base64Data}`,
            cache: true,
          },
          base64: base64Data,
          orderNumber,
        });
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

  return {
    pdfData,
    loading,
    currentPage,
    totalPages,
    handleLoadComplete,
    handlePageChanged,
    handleError,
  };
};
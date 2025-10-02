"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ordersApi } from "@/services/api/orders-api";
import { toast } from "sonner";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

interface InvoicePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderNumber?: string;
}

export function InvoicePreviewDialog({
  open,
  onOpenChange,
  orderId,
  orderNumber,
}: InvoicePreviewDialogProps) {
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (open && orderId) {
      loadPdfPreview();
    }

    // Cleanup: revoke blob URL when dialog closes
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [open, orderId]);

  const loadPdfPreview = async () => {
    try {
      setLoading(true);
      const blob = await ordersApi.downloadInvoice(orderId);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error("Failed to load invoice preview:", error);
      toast.error("Fatura önizleme yüklenemedi");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!pdfUrl) return;

    try {
      setDownloading(true);
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `fatura-${orderNumber || orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Fatura indiriliyor");
    } catch (error) {
      console.error("Failed to download invoice:", error);
      toast.error("Fatura indirilemedi");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0" showCloseButton={false}>
        {/* Accessibility Title */}
        <VisuallyHidden>
          <DialogTitle>Fatura Önizleme</DialogTitle>
        </VisuallyHidden>

        {/* Custom Header */}
        <div className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              Fatura Önizleme {orderNumber && `- Sipariş #${orderNumber}`}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!pdfUrl || downloading || loading}
              >
                {downloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                İndir
              </Button>
              <button
                onClick={() => onOpenChange(false)}
                className="rounded-full p-1 hover:bg-muted transition-colors"
              >
                <X size={24} className="text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Fatura yükleniyor...</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title="Fatura Önizleme"
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground">
                Fatura yüklenemedi. Lütfen tekrar deneyin.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

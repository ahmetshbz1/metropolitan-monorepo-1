import { useMemo, useState, type ChangeEvent } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";

import { importProducts } from "./api";
import type { ProductImportSummary } from "./types";

interface ProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted: (summary: ProductImportSummary) => void;
}

const MAX_ERROR_PREVIEW = 10;

export const ProductImportModal = ({
  isOpen,
  onClose,
  onCompleted,
}: ProductImportModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ProductImportSummary | null>(null);

  const handleClose = () => {
    setSelectedFile(null);
    setSummary(null);
    setError(null);
    onClose();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setSummary(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Lütfen CSV veya Excel dosyası seçin");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      const result = await importProducts(selectedFile);
      setSummary(result);
      onCompleted(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yükleme başarısız oldu");
    } finally {
      setIsUploading(false);
    }
  };

  const errorPreview = useMemo(() => {
    if (!summary?.errors?.length) {
      return [] as ProductImportSummary["errors"];
    }
    return summary.errors.slice(0, MAX_ERROR_PREVIEW);
  }, [summary]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1 text-left">
              <span className="text-base font-semibold text-slate-900 dark:text-white">
                Toplu Ürün Güncelleme
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Desteklenen formatlar: CSV, XLSX. Gerekli kolon: productCode.
              </span>
            </ModalHeader>
            <ModalBody className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Dosya Seç
                </label>
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileChange}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-[#2a2a2a] dark:bg-[#111111] dark:text-slate-200"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Kolonlar: productCode, stock, individualPrice, corporatePrice, minQuantityIndividual,
                  minQuantityCorporate, quantityPerBox
                </p>
              </div>

              {error ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
                  {error}
                </div>
              ) : null}

              {summary ? (
                <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-[#2a2a2a] dark:bg-[#161616] dark:text-slate-200">
                  <div className="flex flex-wrap gap-3">
                    <span>İşlenen satır: {summary.processed}</span>
                    <span>Güncellenen: {summary.updated}</span>
                    <span>Atlanan: {summary.skipped}</span>
                  </div>
                  {summary.errors.length > 0 ? (
                    <div className="space-y-1 text-xs">
                      <span className="font-medium text-red-600 dark:text-red-400">
                        Hatalar ({summary.errors.length})
                      </span>
                      <ul className="space-y-1">
                        {errorPreview.map((item) => (
                          <li key={`${item.row}-${item.message}`} className="text-slate-500 dark:text-slate-300">
                            Satır {item.row}: {item.message}
                          </li>
                        ))}
                      </ul>
                      {summary.errors.length > MAX_ERROR_PREVIEW ? (
                        <span className="text-slate-400 dark:text-slate-500">
                          Liste yalnızca ilk {MAX_ERROR_PREVIEW} hatayı gösterir.
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={handleClose} isDisabled={isUploading}>
                Kapat
              </Button>
              <Button
                color="primary"
                onPress={() => void handleUpload()}
                isLoading={isUploading}
                isDisabled={!selectedFile}
              >
                Yükle
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

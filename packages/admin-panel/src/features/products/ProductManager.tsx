import { useCallback, useState } from "react";
import { Button, Drawer, DrawerBody, DrawerContent, DrawerHeader } from "@heroui/react";
import { Download, Plus, Upload } from "lucide-react";

import { deleteProduct, createProduct, updateProduct, exportProducts } from "./api";
import { ProductFormV2 } from "./ProductForm.v2";
import { ProductList } from "./ProductList";
import { ProductImportModal } from "./ProductImportModal";
import type { AdminProduct, AdminProductPayload, ProductImportSummary } from "./types";
import { useToast } from "../../hooks/useToast";
import { useConfirm } from "../../hooks/useConfirm";

export const ProductManager = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<"csv" | "xlsx" | null>(null);
  const [importSummary, setImportSummary] = useState<ProductImportSummary | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<AdminProduct[]>([]);
  const [selectionResetSignal, setSelectionResetSignal] = useState(0);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const { showToast } = useToast();
  const confirm = useConfirm();

  const clearSelection = useCallback(() => {
    setSelectedProducts([]);
    setSelectionResetSignal((prev) => prev + 1);
  }, []);

  const handleSelectionDetailsChange = useCallback((items: AdminProduct[]) => {
    setSelectedProducts(items);
  }, []);

  const handleSelectionIdsChange = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) {
        setSelectedProducts([]);
      }
    },
    []
  );

  const handleCreate = async (payload: AdminProductPayload) => {
    await createProduct(payload);
    setIsDrawerOpen(false);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleUpdate = async (
    payload: AdminProductPayload,
    productId?: string
  ) => {
    if (!productId) {
      throw new Error("Ürün ID zorunludur");
    }
    await updateProduct(productId, payload);
    setIsDrawerOpen(false);
    setEditingProduct(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleDelete = async (productId: string, product?: AdminProduct) => {
    const confirmed = await confirm({
      title: "Ürünü Sil",
      description:
        "Bu ürünü kalıcı olarak silmek istediğinizden emin misiniz? Ürün siparişlerde kullanılıyorsa işlem engellenecektir.",
      confirmLabel: "Sil",
      cancelLabel: "Vazgeç",
      tone: "danger",
    });

    if (!confirmed) {
      return;
    }

    try {
      await deleteProduct(productId);
      setRefreshTrigger((prev) => prev + 1);
      setSelectedProducts((current) => current.filter((item) => item.productId !== productId));
      showToast({
        type: "success",
        title: "Ürün silindi",
        description: product ? `${product.translations.tr.name} listeden kaldırıldı.` : undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ürün silinemedi";
      showToast({ type: "error", title: "Silme işlemi başarısız", description: message });
    }
  };

  const handleBulkDelete = useCallback(async () => {
    if (selectedProducts.length === 0) {
      return;
    }

    const confirmed = await confirm({
      title: "Seçilen ürünleri sil",
      description: `${selectedProducts.length} ürünü kalıcı olarak silmek istediğinize emin misiniz?` +
        " Ürünler siparişlerde kullanılıyorsa silme işlemi engellenecektir.",
      confirmLabel: "Sil",
      cancelLabel: "Vazgeç",
      tone: "danger",
    });

    if (!confirmed) {
      return;
    }

    try {
      setIsBulkDeleting(true);
      const results = await Promise.allSettled(
        selectedProducts.map(async (product) => {
          await deleteProduct(product.productId);
          return product;
        })
      );

      const succeeded = results.filter(
        (result): result is PromiseFulfilledResult<AdminProduct> => result.status === "fulfilled"
      );
      const failed = results.filter(
        (result): result is PromiseRejectedResult => result.status === "rejected"
      );

      if (succeeded.length > 0) {
        setRefreshTrigger((prev) => prev + 1);
        showToast({
          type: "success",
          title: "Silme işlemi tamamlandı",
          description: `${succeeded.length} ürün listeden kaldırıldı.`,
        });
      }

      if (failed.length > 0) {
        console.error("Toplu ürün silme hataları:", failed);
        showToast({
          type: "error",
          title: "Bazı ürünler silinemedi",
          description: `${failed.length} ürün silinemedi, ayrıntılar için günlükleri kontrol edin.`,
        });
      }
    } finally {
      setIsBulkDeleting(false);
      clearSelection();
    }
  }, [clearSelection, confirm, selectedProducts, showToast]);

  const handleEdit = (product: AdminProduct) => {
    setEditingProduct(product);
    setIsDrawerOpen(true);
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setEditingProduct(null);
  };

  const handleExport = async (format: "csv" | "xlsx") => {
    try {
      setExportingFormat(format);
      const blob = await exportProducts({ format });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      link.href = url;
      link.download = `products-${timestamp}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast({
        type: "success",
        title: format === "xlsx" ? "Excel indirildi" : "CSV indirildi",
        description: "Dışa aktarma tamamlandı.",
        duration: 3000,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Dosya indirilemedi";
      showToast({ type: "error", title: "Dışa aktarma başarısız", description: message });
    } finally {
      setExportingFormat(null);
    }
  };

  const handleImportOpen = () => {
    setImportSummary(null);
    setIsImportModalOpen(true);
  };

  const handleImportCompleted = (summary: ProductImportSummary) => {
    setImportSummary(summary);
    setRefreshTrigger((prev) => prev + 1);
    setIsImportModalOpen(false);
    showToast({
      type: summary.errors.length > 0 ? "warning" : "success",
      title: "Toplu ürün güncellemesi tamamlandı",
      description: `Güncellenen: ${summary.updated}, Atlanan: ${summary.skipped}, Hata: ${summary.errors.length}`,
    });
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Ürün Yönetimi</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Türkçe girin, çeviriler otomatik oluşturulsun
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="flat"
              startContent={<Download className="h-4 w-4" />}
              onPress={() => void handleExport("csv")}
              isLoading={exportingFormat === "csv"}
              className="w-full sm:w-auto"
            >
              CSV İndir
            </Button>
            <Button
              variant="flat"
              startContent={<Download className="h-4 w-4" />}
              onPress={() => void handleExport("xlsx")}
              isLoading={exportingFormat === "xlsx"}
              className="w-full sm:w-auto"
            >
              Excel İndir
            </Button>
            <Button
              variant="flat"
              startContent={<Upload className="h-4 w-4" />}
              onPress={handleImportOpen}
              className="w-full sm:w-auto"
            >
              Toplu Yükle
            </Button>
          </div>
          <Button
            color="primary"
            startContent={<Plus className="h-4 w-4" />}
            onPress={handleNewProduct}
            className="w-full sm:w-auto"
          >
            Yeni Ürün Ekle
          </Button>
        </div>
      </div>

      {importSummary ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-[#2a2a2a] dark:bg-[#161616] dark:text-slate-200">
          <span className="font-medium text-slate-700 dark:text-slate-100">Son toplu yükleme özeti:</span>
          <div className="mt-1 flex flex-wrap gap-3">
            <span>İşlenen: {importSummary.processed}</span>
            <span>Güncellenen: {importSummary.updated}</span>
            <span>Atlanan: {importSummary.skipped}</span>
            <span>Hata: {importSummary.errors.length}</span>
          </div>
        </div>
      ) : null}

      <ProductList
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSelectionChange={handleSelectionIdsChange}
        onSelectionDetailsChange={handleSelectionDetailsChange}
        selectionResetSignal={selectionResetSignal}
        refreshTrigger={refreshTrigger}
      />

      {selectedProducts.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-[#2a2a2a] dark:bg-[#161616] dark:text-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-semibold">Seçilen ürün: {selectedProducts.length}</span>
            <div className="flex flex-wrap gap-2">
              <Button variant="flat" onPress={clearSelection} className="min-w-[140px]">
                Seçimi Temizle
              </Button>
              <Button
                color="danger"
                variant="solid"
                onPress={() => void handleBulkDelete()}
                isLoading={isBulkDeleting}
                className="min-w-[160px]"
              >
                Seçilenleri Sil
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Drawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        size="5xl"
        className="max-sm:!w-full"
      >
        <DrawerContent className="dark:bg-[#1a1a1a]">
          <DrawerHeader className="dark:border-b dark:border-[#2a2a2a]">
            <h2 className="text-lg font-semibold dark:text-white">
              {editingProduct ? "Ürün Düzenle" : "Yeni Ürün Ekle"}
            </h2>
          </DrawerHeader>
          <DrawerBody>
            <ProductFormV2
              mode={editingProduct ? "update" : "create"}
              onSubmit={editingProduct ? handleUpdate : handleCreate}
              initialProduct={editingProduct || undefined}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <ProductImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onCompleted={handleImportCompleted}
      />
    </div>
  );
};

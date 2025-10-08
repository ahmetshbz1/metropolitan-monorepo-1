import { useCallback, useState } from "react";
import { Button, Drawer, DrawerBody, DrawerContent, DrawerHeader } from "@heroui/react";
import { Plus } from "lucide-react";

import { deleteCategory, createCategory } from "./api";
import { CategoryForm } from "./CategoryForm";
import { CategoryList } from "./CategoryList";
import type { AdminCategory, AdminCategoryPayload } from "./types";
import { useConfirm } from "../../hooks/useConfirm";
import { useToast } from "../../hooks/useToast";

export const CategoryManager = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<AdminCategory[]>([]);
  const [selectionResetSignal, setSelectionResetSignal] = useState(0);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const confirm = useConfirm();
  const { showToast } = useToast();

  const clearSelection = useCallback(() => {
    setSelectedCategories([]);
    setSelectionResetSignal((prev) => prev + 1);
  }, []);

  const handleCreate = async (payload: AdminCategoryPayload) => {
    await createCategory(payload);
    setIsDrawerOpen(false);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleDelete = useCallback(
    async (categoryId: string) => {
      const confirmed = await confirm({
        title: "Kategori Sil",
        description: "Bu kategoriyi kalıcı olarak silmek istediğinizden emin misiniz?",
        confirmLabel: "Sil",
        cancelLabel: "Vazgeç",
        tone: "danger",
      });

      if (!confirmed) {
        return;
      }

      try {
        await deleteCategory(categoryId);
        setRefreshTrigger((prev) => prev + 1);
        setSelectedCategories((current) => current.filter((category) => category.id !== categoryId));
        showToast({ type: "success", title: "Kategori silindi" });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Kategori silinemedi";
        showToast({ type: "error", title: "Silme başarısız", description: message });
      }
    },
    [confirm, showToast]
  );

  const handleBulkDelete = useCallback(async () => {
    if (selectedCategories.length === 0) {
      return;
    }

    const confirmed = await confirm({
      title: "Seçilen kategorileri sil",
      description: `${selectedCategories.length} kategoriyi kalıcı olarak silmek istediğinize emin misiniz?`,
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
        selectedCategories.map(async (category) => {
          await deleteCategory(category.id);
          return category;
        })
      );

      const succeeded = results.filter(
        (result): result is PromiseFulfilledResult<AdminCategory> => result.status === "fulfilled"
      );
      const failed = results.filter(
        (result): result is PromiseRejectedResult => result.status === "rejected"
      );

      if (succeeded.length > 0) {
        setRefreshTrigger((prev) => prev + 1);
        showToast({
          type: "success",
          title: "Kategoriler silindi",
          description: `${succeeded.length} kategori kaldırıldı.`,
        });
      }

      if (failed.length > 0) {
        console.error("Toplu kategori silme hataları:", failed);
        showToast({
          type: "error",
          title: "Bazı kategoriler silinemedi",
          description: `${failed.length} kategori silinemedi, ayrıntılar için günlükleri kontrol edin.`,
        });
      }
    } finally {
      setIsBulkDeleting(false);
      clearSelection();
    }
  }, [clearSelection, confirm, selectedCategories, showToast]);

  const handleSelectionDetailsChange = useCallback((items: AdminCategory[]) => {
    setSelectedCategories(items);
  }, []);

  const handleSelectionIdsChange = useCallback((ids: string[]) => {
    if (ids.length === 0) {
      setSelectedCategories([]);
    }
  }, []);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Kategori Yönetimi</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Çok dilli kategori içeriklerini yönetin
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus className="h-4 w-4" />}
          onPress={() => setIsDrawerOpen(true)}
          className="w-full sm:w-auto"
        >
          Yeni Kategori Ekle
        </Button>
      </div>

      <CategoryList
        onDelete={handleDelete}
        onSelectionChange={handleSelectionIdsChange}
        onSelectionDetailsChange={handleSelectionDetailsChange}
        selectionResetSignal={selectionResetSignal}
        refreshTrigger={refreshTrigger}
      />

      {selectedCategories.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-[#2a2a2a] dark:bg-[#161616] dark:text-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-semibold">Seçilen kategori: {selectedCategories.length}</span>
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
        onClose={() => setIsDrawerOpen(false)}
        size="3xl"
        className="max-sm:!w-full"
      >
        <DrawerContent className="dark:bg-[#1a1a1a]">
          <DrawerHeader className="dark:border-b dark:border-[#2a2a2a]">
            <h2 className="text-lg font-semibold dark:text-white">Yeni Kategori Ekle</h2>
          </DrawerHeader>
          <DrawerBody>
            <CategoryForm onSubmit={handleCreate} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

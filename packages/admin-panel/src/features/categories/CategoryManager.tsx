import { useState } from "react";
import { Button, Drawer, DrawerBody, DrawerContent, DrawerHeader } from "@heroui/react";
import { Plus } from "lucide-react";

import { deleteCategory, createCategory } from "./api";
import { CategoryForm } from "./CategoryForm";
import { CategoryList } from "./CategoryList";
import type { AdminCategoryPayload } from "./types";
import { useConfirm } from "../../hooks/useConfirm";
import { useToast } from "../../hooks/useToast";

export const CategoryManager = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const confirm = useConfirm();
  const { showToast } = useToast();

  const handleCreate = async (payload: AdminCategoryPayload) => {
    await createCategory(payload);
    setIsDrawerOpen(false);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleDelete = async (categoryId: string) => {
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
      showToast({ type: "success", title: "Kategori silindi" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kategori silinemedi";
      showToast({ type: "error", title: "Silme başarısız", description: message });
    }
  };

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
        refreshTrigger={refreshTrigger}
      />

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        size="3xl"
        className="max-sm:!w-full"
      >
        <DrawerContent className="dark:bg-[#1a1a1a]">
          <DrawerHeader className="dark:border-b dark:border-[#2a2a2a]">
            <h2 className="text-lg font-semibold dark:text-white">
              Yeni Kategori Ekle
            </h2>
          </DrawerHeader>
          <DrawerBody>
            <CategoryForm onSubmit={handleCreate} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

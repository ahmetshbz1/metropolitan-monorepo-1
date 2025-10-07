import { useState } from "react";
import { Button, Drawer, DrawerBody, DrawerContent, DrawerHeader } from "@heroui/react";
import { Plus } from "lucide-react";

import { deleteProduct, createProduct, updateProduct } from "./api";
import { ProductForm } from "./ProductForm";
import { ProductList } from "./ProductList";
import type { AdminProduct, AdminProductPayload } from "./types";

export const ProductManager = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  const handleDelete = async (productId: string) => {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) {
      return;
    }

    try {
      await deleteProduct(productId);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Ürün silinemedi");
    }
  };

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

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Ürün Yönetimi</h1>
          <p className="text-sm text-slate-500">
            Çok dilli ürün içeriklerini yönetin
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus className="h-4 w-4" />}
          onPress={handleNewProduct}
        >
          Yeni Ürün Ekle
        </Button>
      </div>

      <ProductList
        onEdit={handleEdit}
        onDelete={handleDelete}
        refreshTrigger={refreshTrigger}
      />

      <Drawer isOpen={isDrawerOpen} onClose={handleDrawerClose} size="5xl">
        <DrawerContent>
          <DrawerHeader>
            <h2 className="text-lg font-semibold">
              {editingProduct ? "Ürün Düzenle" : "Yeni Ürün Ekle"}
            </h2>
          </DrawerHeader>
          <DrawerBody>
            <ProductForm
              mode={editingProduct ? "update" : "create"}
              onSubmit={editingProduct ? handleUpdate : handleCreate}
              initialProduct={editingProduct || undefined}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

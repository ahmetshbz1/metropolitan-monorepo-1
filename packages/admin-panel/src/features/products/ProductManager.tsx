import { useState } from "react";
import { Button, Card, CardBody, CardHeader, Input, Spacer, Tab, Tabs } from "@heroui/react";

import { deleteProduct, createProduct, updateProduct } from "./api";
import { ProductForm } from "./ProductForm";
import type { AdminProductPayload } from "./types";

export const ProductManager = () => {
  const [deleteProductId, setDeleteProductId] = useState<string>("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = async (payload: AdminProductPayload) => {
    await createProduct(payload);
  };

  const handleUpdate = async (
    payload: AdminProductPayload,
    productId?: string
  ) => {
    if (!productId) {
      throw new Error("Ürün ID zorunludur");
    }
    await updateProduct(productId, payload);
  };

  const handleDelete = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDeleteError(null);
    setDeleteSuccess(null);

    if (!deleteProductId.trim()) {
      setDeleteError("Ürün ID zorunludur");
      return;
    }

    try {
      setIsDeleting(true);
      await deleteProduct(deleteProductId.trim());
      setDeleteSuccess("Ürün silindi");
      setDeleteProductId("");
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Ürün silinemedi"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Tabs aria-label="Admin ürün yönetimi" color="primary" variant="solid">
        <Tab key="create" title="Ürün Ekle">
          <ProductForm mode="create" onSubmit={handleCreate} />
        </Tab>
        <Tab key="update" title="Ürün Güncelle">
          <ProductForm mode="update" onSubmit={handleUpdate} />
        </Tab>
        <Tab key="delete" title="Ürün Sil">
          <Card className="w-full">
            <CardHeader className="flex flex-col items-start gap-2 pb-0">
              <h3 className="text-xl font-semibold text-slate-900">
                Ürün Sil
              </h3>
              <p className="text-sm text-default-500">
                Ürün ID değerini girerek ilgili kaydı kalıcı olarak silebilirsiniz.
              </p>
            </CardHeader>
            <CardBody>
              <form className="flex flex-col gap-4" onSubmit={handleDelete}>
                <Input
                  label="Ürün ID"
                  placeholder="UUID değeri"
                  value={deleteProductId}
                  onValueChange={setDeleteProductId}
                  variant="bordered"
                  isRequired
                />
                {deleteError ? (
                  <p className="text-sm text-red-500" role="alert">
                    {deleteError}
                  </p>
                ) : null}
                {deleteSuccess ? (
                  <p className="text-sm text-green-600" role="status">
                    {deleteSuccess}
                  </p>
                ) : null}
                <Spacer y={1} />
                <Button
                  color="danger"
                  type="submit"
                  isLoading={isDeleting}
                  className="self-start"
                >
                  Ürünü Sil
                </Button>
              </form>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
};

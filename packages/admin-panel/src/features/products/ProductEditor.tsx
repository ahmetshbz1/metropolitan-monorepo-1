// Simplified Product Editor with React Query
import { useEffect, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Spinner,
} from "@heroui/react";
import { useProduct, useUpdateProduct, useCreateProduct } from "../../hooks/useProducts";
import { taxRateToString, validateTaxRate, type TaxRate } from "../../types/product.types";
import type { AdminProductPayload } from "../../api/products";

interface ProductEditorProps {
  productId?: string;
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "update";
}

export function ProductEditor({ productId, isOpen, onClose, mode }: ProductEditorProps) {
  const { data: product, isLoading } = useProduct(productId);
  const updateMutation = useUpdateProduct();
  const createMutation = useCreateProduct();

  const [formData, setFormData] = useState({
    productCode: "",
    stock: "",
    tax: "23",
    price: "",
  });

  // Load product data when editing
  useEffect(() => {
    if (mode === "update" && product) {
      setFormData({
        productCode: product.productCode,
        stock: product.stock.toString(),
        tax: taxRateToString(product.tax),
        price: product.price?.toString() || "",
      });
    }
  }, [product, mode]);

  const handleSubmit = async () => {
    try {
      const payload: Partial<AdminProductPayload> = {
        stock: parseInt(formData.stock, 10) || 0,
        tax: validateTaxRate(formData.tax),
        price: parseFloat(formData.price) || 0,
      };

      if (mode === "update" && productId) {
        await updateMutation.mutateAsync({ productId, payload: payload as AdminProductPayload });
      } else {
        await createMutation.mutateAsync(payload as AdminProductPayload);
      }

      onClose();
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  const isSubmitting = updateMutation.isPending || createMutation.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <ModalContent>
        {(onModalClose) => (
          <>
            <ModalHeader>
              {mode === "create" ? "Yeni Ürün" : "Ürün Düzenle"}
            </ModalHeader>
            <ModalBody>
              {isLoading && mode === "update" ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <Input
                    label="Ürün Kodu"
                    value={formData.productCode}
                    onValueChange={(val) => setFormData({ ...formData, productCode: val })}
                    isRequired
                  />

                  <Input
                    label="Stok"
                    type="number"
                    value={formData.stock}
                    onValueChange={(val) => setFormData({ ...formData, stock: val })}
                    isRequired
                  />

                  <Input
                    label="Fiyat (PLN)"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onValueChange={(val) => setFormData({ ...formData, price: val })}
                    isRequired
                  />

                  <Select
                    label="VAT Oranı (%)"
                    placeholder="VAT seçin"
                    selectedKeys={formData.tax ? [formData.tax] : []}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;
                      setFormData({ ...formData, tax: selected || "23" });
                    }}
                    isRequired
                  >
                    <SelectItem key="0" value="0">0%</SelectItem>
                    <SelectItem key="5" value="5">5%</SelectItem>
                    <SelectItem key="7" value="7">7%</SelectItem>
                    <SelectItem key="8" value="8">8%</SelectItem>
                    <SelectItem key="23" value="23">23%</SelectItem>
                  </Select>

                  {mode === "update" && product && (
                    <div className="text-sm text-gray-500">
                      <p>Sync Status: {product.syncStatus || "unknown"}</p>
                      {product.lastSyncedAt && (
                        <p>Last Synced: {new Date(product.lastSyncedAt).toLocaleString()}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onModalClose}>
                İptal
              </Button>
              <Button
                color="primary"
                onPress={handleSubmit}
                isLoading={isSubmitting}
                isDisabled={isLoading}
              >
                {mode === "create" ? "Oluştur" : "Güncelle"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

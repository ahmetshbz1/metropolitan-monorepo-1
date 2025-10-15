import { useState, useCallback, useMemo } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Input,
  Button,
  Card,
  CardBody,
  Spinner,
  Image,
} from "@heroui/react";
import { Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getProducts, type Product } from "../api/products";

interface ProductSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
}

export function ProductSelector({
  isOpen,
  onClose,
  onSelect,
}: ProductSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["products", searchQuery],
    queryFn: () => getProducts({ search: searchQuery, limit: 100 }),
    enabled: isOpen,
  });

  const filteredProducts = useMemo(() => {
    if (!data?.data) return [];
    if (!searchQuery.trim()) return data.data;

    const query = searchQuery.toLowerCase();
    return data.data.filter(
      (product) =>
        product.name?.toLowerCase().includes(query) ||
        product.brand?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query)
    );
  }, [data?.data, searchQuery]);

  const handleSelect = useCallback(
    (product: Product) => {
      onSelect(product);
      onClose();
      setSearchQuery("");
    },
    [onSelect, onClose]
  );

  const handleClose = useCallback(() => {
    onClose();
    setSearchQuery("");
  }, [onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="3xl"
      scrollBehavior="inside"
      classNames={{
        base: "max-h-[90vh]",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span>Ürün Seç</span>
            <Button
              isIconOnly
              variant="light"
              onPress={handleClose}
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </ModalHeader>
        <ModalBody className="pb-6">
          <Input
            placeholder="Ürün ara (isim, marka, kategori...)"
            value={searchQuery}
            onValueChange={setSearchQuery}
            startContent={<Search className="h-4 w-4 text-slate-400" />}
            variant="bordered"
            size="lg"
            autoFocus
          />

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-4">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  Ürün bulunamadı
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    isPressable
                    onPress={() => handleSelect(product)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <CardBody>
                      <div className="flex items-center gap-4">
                        <Image
                          src={
                            product.image.startsWith("http")
                              ? product.image
                              : `${import.meta.env.VITE_API_BASE_URL || "https://api.metropolitanfg.pl"}${product.image}`
                          }
                          alt={product.name}
                          width={60}
                          height={60}
                          className="object-contain"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {product.name}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {product.brand} • {product.category}
                          </p>
                          {product.size && (
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                              {product.size}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">
                            {product.price} {product.currency}
                          </p>
                          <p className="text-xs text-slate-500">
                            Stok: {product.stock}
                          </p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))
              )}
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

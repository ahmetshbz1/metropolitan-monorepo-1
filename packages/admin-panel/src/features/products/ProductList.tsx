import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Spinner,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { MoreVertical } from "lucide-react";
import { getProducts } from "./api";
import type { AdminProduct } from "./types";

interface ProductListProps {
  onEdit: (product: AdminProduct) => void;
  onDelete: (productId: string) => void;
  refreshTrigger?: number;
}

export const ProductList = ({
  onEdit,
  onDelete,
  refreshTrigger,
}: ProductListProps) => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);

  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getProducts({ limit, offset });
      setProducts(response.items);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ürünler yüklenemedi");
    } finally {
      setIsLoading(false);
    }
  }, [limit, offset]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts, refreshTrigger]);

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  const handleNextPage = () => {
    if (offset + limit < total) {
      setOffset(offset + limit);
    }
  };

  const handlePrevPage = () => {
    if (offset > 0) {
      setOffset(Math.max(0, offset - limit));
    }
  };

  const formatPrice = (price: number | null, currency: string) => {
    if (price === null) return "-";
    return `${price.toFixed(2)} ${currency}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-red-200 bg-red-50 p-8">
        <p className="text-sm text-red-600">{error}</p>
        <Button size="sm" color="danger" variant="flat" onPress={loadProducts}>
          Tekrar Dene
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Toplam:</span>
          <Chip size="sm" variant="flat" color="primary">
            {total}
          </Chip>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="flat"
              isDisabled={offset === 0}
              onPress={handlePrevPage}
            >
              Önceki
            </Button>
            <span className="text-sm text-slate-600">
              Sayfa {currentPage} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="flat"
              isDisabled={offset + limit >= total}
              onPress={handleNextPage}
            >
              Sonraki
            </Button>
          </div>
        )}
      </div>

      <Table aria-label="Ürün listesi">
        <TableHeader>
          <TableColumn>KOD</TableColumn>
          <TableColumn>ÜRÜN ADI</TableColumn>
          <TableColumn>MARKA</TableColumn>
          <TableColumn>STOK</TableColumn>
          <TableColumn>FİYAT</TableColumn>
          <TableColumn>GÜNCELLEME</TableColumn>
          <TableColumn width={50}>İŞLEM</TableColumn>
        </TableHeader>
        <TableBody
          items={products}
          isLoading={isLoading}
          loadingContent={<Spinner label="Yükleniyor..." />}
          emptyContent="Ürün bulunamadı"
        >
          {(product) => (
            <TableRow key={product.productId}>
              <TableCell>
                <span className="font-mono text-xs">{product.productCode}</span>
              </TableCell>
              <TableCell>
                <span className="font-medium">{product.translations.tr.name}</span>
              </TableCell>
              <TableCell>{product.brand || "-"}</TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  color={product.stock > 0 ? "success" : "danger"}
                  variant="flat"
                >
                  {product.stock}
                </Chip>
              </TableCell>
              <TableCell>
                {formatPrice(
                  product.individualPrice || product.price,
                  product.currency
                )}
              </TableCell>
              <TableCell>
                <span className="text-xs text-slate-500">
                  {formatDate(product.updatedAt)}
                </span>
              </TableCell>
              <TableCell>
                <Dropdown>
                  <DropdownTrigger>
                    <Button isIconOnly size="sm" variant="light">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label="Ürün işlemleri">
                    <DropdownItem key="edit" onPress={() => onEdit(product)}>
                      Düzenle
                    </DropdownItem>
                    <DropdownItem
                      key="delete"
                      className="text-danger"
                      color="danger"
                      onPress={() => onDelete(product.productId)}
                    >
                      Sil
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

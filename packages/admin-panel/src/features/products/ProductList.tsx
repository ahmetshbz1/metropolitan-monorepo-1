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
  Image,
  Pagination,
  Input,
  Select,
  SelectItem,
  type Selection,
} from "@heroui/react";
import { MoreVertical, ImageOff, Search } from "lucide-react";
import { getProducts } from "./api";
import type { AdminProduct } from "./types";
import { API_BASE_URL } from "../../config/env";
import { getCategories } from "../categories/api";
import type { AdminCategory } from "../categories/types";

interface ProductListProps {
  onEdit: (product: AdminProduct) => void;
  onDelete: (productId: string, product?: AdminProduct) => void;
  onSelectionChange?: (ids: string[]) => void;
  onSelectionDetailsChange?: (products: AdminProduct[]) => void;
  selectionResetSignal?: number;
  refreshTrigger?: number;
}

const areSetsEqual = (a: Set<string>, b: Set<string>) => {
  if (a.size !== b.size) {
    return false;
  }
  for (const value of a) {
    if (!b.has(value)) {
      return false;
    }
  }
  return true;
};

export const ProductList = ({
  onEdit,
  onDelete,
  onSelectionChange,
  onSelectionDetailsChange,
  selectionResetSignal,
  refreshTrigger,
}: ProductListProps) => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set<string>());
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const emitSelection = useCallback(
    (keys: Set<string>) => {
      setSelectedKeys(keys);

      const ids = Array.from(keys);
      onSelectionChange?.(ids);

      if (onSelectionDetailsChange) {
        const selectedProducts = products.filter((product) => keys.has(product.productId));
        onSelectionDetailsChange(selectedProducts);
      }
    },
    [onSelectionChange, onSelectionDetailsChange, products]
  );

  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getProducts({
        limit,
        offset,
        search: searchQuery || undefined,
        categoryId: selectedCategoryId || undefined,
      });
      setProducts(response.items);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ürünler yüklenemedi");
    } finally {
      setIsLoading(false);
    }
  }, [limit, offset, searchQuery, selectedCategoryId]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts, refreshTrigger]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await getCategories();
        setCategories(response.items);
      } catch (err) {
        console.error("Kategoriler yüklenemedi:", err);
      }
    };
    void loadCategories();
  }, []);

  useEffect(() => {
    const availableIds = new Set(products.map((product) => product.productId));
    const filteredKeys = new Set<string>(Array.from(selectedKeys).filter((id) => availableIds.has(id)));

    if (!areSetsEqual(filteredKeys, selectedKeys)) {
      emitSelection(filteredKeys);
    }
  }, [products, selectedKeys, emitSelection]);

  useEffect(() => {
    if (selectionResetSignal !== undefined) {
      emitSelection(new Set<string>());
    }
  }, [selectionResetSignal, emitSelection]);

  const handleSelectionChange = useCallback(
    (keys: Selection) => {
      const normalizedKeys =
        keys === "all"
          ? new Set<string>(products.map((product) => product.productId))
          : new Set<string>(Array.from(keys as Set<string>));

      emitSelection(normalizedKeys);
    },
    [emitSelection, products]
  );

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handlePageChange = (page: number) => {
    setOffset((page - 1) * limit);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setOffset(0);
  };

  const handleSearchClear = () => {
    setSearchQuery("");
    setOffset(0);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value);
    setOffset(0);
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

  const getProductName = (product: AdminProduct): string => {
    return (
      product.translations.tr.name ||
      product.translations.en.name ||
      product.translations.pl.name ||
      product.productCode
    );
  };

  // Server-side search kullanıyoruz, client-side filtering gerek yok

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-red-200 bg-red-50 p-8 dark:border-red-900 dark:bg-red-950">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <Button size="sm" color="danger" variant="flat" onPress={loadProducts}>
          Tekrar Dene
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            size="sm"
            value={searchQuery}
            onValueChange={handleSearchChange}
            placeholder="Ürün adı, kodu veya marka"
            startContent={<Search className="h-4 w-4 text-slate-400" />}
            onClear={handleSearchClear}
            isClearable
            aria-label="Ürün arama"
            className="max-w-sm"
          />
          <Select
            size="sm"
            placeholder="Tüm kategoriler"
            aria-label="Kategori filtrele"
            className="max-w-xs"
            selectedKeys={selectedCategoryId ? [selectedCategoryId] : []}
            onSelectionChange={(keys) => {
              const selectedKey = Array.from(keys)[0] as string | undefined;
              handleCategoryChange(selectedKey || "");
            }}
          >
            <SelectItem key="" value="">
              Tüm kategoriler
            </SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.translations.tr?.name || category.slug}
              </SelectItem>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {searchQuery || selectedCategoryId ? "Filtrelenmiş: " : "Toplam: "}
            </span>
            <Chip size="sm" variant="flat" color="primary">
              {total}
            </Chip>
          </div>
          {totalPages > 1 ? (
            <Pagination
              size="sm"
              showControls
              total={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              className="ml-auto"
            />
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table
          aria-label="Ürün listesi"
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={handleSelectionChange}
        >
          <TableHeader>
            <TableColumn width={80}>GÖRSEL</TableColumn>
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
            emptyContent={searchQuery ? "Arama sonucu bulunamadı" : "Ürün bulunamadı"}
          >
            {(product) => (
              <TableRow key={product.productId}>
                <TableCell>
                  {product.imageUrl ? (
                    <Image
                      src={`${API_BASE_URL}${product.imageUrl}`}
                      alt={getProductName(product)}
                      width={48}
                      height={48}
                      className="rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 dark:bg-[#2a2a2a]">
                      <ImageOff className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs dark:text-slate-300">{product.productCode}</span>
                </TableCell>
                <TableCell>
                  <span className="font-medium dark:text-slate-200">{getProductName(product)}</span>
                </TableCell>
                <TableCell>
                  <span className="dark:text-slate-300">{product.brand || "-"}</span>
                </TableCell>
                <TableCell>
                  <Chip size="sm" color={product.stock > 0 ? "success" : "danger"} variant="flat">
                    {product.stock}
                  </Chip>
                </TableCell>
                <TableCell>
                  {formatPrice(product.individualPrice || product.price, product.currency)}
                </TableCell>
                <TableCell>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(product.updatedAt)}</span>
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
                        onPress={() => onDelete(product.productId, product)}
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
    </div>
  );
};

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
import { getCategories } from "./api";
import type { AdminCategory } from "./types";

interface CategoryListProps {
  onDelete: (categoryId: string) => void;
  refreshTrigger?: number;
}

export const CategoryList = ({
  onDelete,
  refreshTrigger,
}: CategoryListProps) => {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const loadCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getCategories();
      setCategories(response.items);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kategoriler yüklenemedi");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories, refreshTrigger]);

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
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-red-200 bg-red-50 p-8 dark:border-red-900 dark:bg-red-950">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <Button size="sm" color="danger" variant="flat" onPress={loadCategories}>
          Tekrar Dene
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 dark:text-slate-400">Toplam:</span>
          <Chip size="sm" variant="flat" color="primary">
            {total}
          </Chip>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table aria-label="Kategori listesi">
          <TableHeader>
            <TableColumn>SLUG</TableColumn>
            <TableColumn>AD (TR)</TableColumn>
            <TableColumn>AD (EN)</TableColumn>
            <TableColumn>AD (PL)</TableColumn>
            <TableColumn>OLUŞTURULMA</TableColumn>
            <TableColumn width={50}>İŞLEM</TableColumn>
          </TableHeader>
          <TableBody
            items={categories}
            isLoading={isLoading}
            loadingContent={<Spinner label="Yükleniyor..." />}
            emptyContent="Kategori bulunamadı"
          >
            {(category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <span className="font-mono text-xs dark:text-slate-300">{category.slug}</span>
                </TableCell>
                <TableCell>
                  <span className="font-medium dark:text-slate-200">{category.translations.tr?.name || "-"}</span>
                </TableCell>
                <TableCell>
                  <span className="dark:text-slate-300">{category.translations.en?.name || "-"}</span>
                </TableCell>
                <TableCell>
                  <span className="dark:text-slate-300">{category.translations.pl?.name || "-"}</span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(category.createdAt)}
                  </span>
                </TableCell>
                <TableCell>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button isIconOnly size="sm" variant="light">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Kategori işlemleri">
                      <DropdownItem
                        key="delete"
                        className="text-danger"
                        color="danger"
                        onPress={() => onDelete(category.id)}
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

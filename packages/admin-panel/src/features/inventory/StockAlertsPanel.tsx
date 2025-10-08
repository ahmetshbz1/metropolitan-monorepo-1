import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { AlertTriangle, Pencil, RefreshCw, Search } from "lucide-react";
import { getStockAlerts, updateProductQuickSettings } from "./api";
import type {
  StockAlertItem,
  StockAlertLevel,
  StockAlertSummary,
} from "./types";

type LevelFilter = "all" | StockAlertLevel;

interface FiltersState {
  level: LevelFilter;
  search: string;
}

const LEVEL_OPTIONS: Array<{ key: LevelFilter; label: string }> = [
  { key: "all", label: "Tüm Uyarılar" },
  { key: "critical", label: "Kritik (0 stok)" },
  { key: "warning", label: "Düşük stok" },
];

const LEVEL_COLOR: Record<StockAlertLevel, "danger" | "warning"> = {
  critical: "danger",
  warning: "warning",
};

const LEVEL_LABEL: Record<StockAlertLevel, string> = {
  critical: "Kritik",
  warning: "Uyarı",
};

const formatDate = (value: string): string =>
  new Date(value).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatNumber = (value: number): string => value.toLocaleString("tr-TR");

const formatPriceInput = (value: string | null): string => {
  if (!value) {
    return "";
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "";
  }

  return numeric.toString();
};

const formatPriceDisplay = (value: string | null): string => {
  if (!value) {
    return "-";
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "-";
  }

  return numeric.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const StockAlertsPanel = () => {
  const [alerts, setAlerts] = useState<StockAlertItem[]>([]);
  const [summary, setSummary] = useState<StockAlertSummary | null>(null);
  const [filters, setFilters] = useState<FiltersState>({ level: "all", search: "" });
  const [searchDraft, setSearchDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(
    null
  );
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [quickEdit, setQuickEdit] = useState<{
    productId: string | null;
    stock: string;
    individualPrice: string;
    corporatePrice: string;
  }>({ productId: null, stock: "", individualPrice: "", corporatePrice: "" });
  const [isQuickSaving, setIsQuickSaving] = useState(false);

  const loadAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getStockAlerts({
        limit: 100,
        level: filters.level,
        search: filters.search,
      });
      setAlerts(response.items);
      setSummary(response.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Stok uyarıları yüklenemedi");
    } finally {
      setIsLoading(false);
    }
  }, [filters.level, filters.search]);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  useEffect(() => {
    if (!isQuickModalOpen || !quickEdit.productId) {
      return;
    }

    const current = alerts.find((item) => item.productId === quickEdit.productId);
    if (!current) {
      setIsQuickModalOpen(false);
      setQuickEdit({ productId: null, stock: "", individualPrice: "", corporatePrice: "" });
      return;
    }

    setQuickEdit((prev) => ({
      ...prev,
      productId: current.productId,
      stock: current.stock.toString(),
      individualPrice: formatPriceInput(current.individualPrice),
      corporatePrice: formatPriceInput(current.corporatePrice),
    }));
  }, [alerts, isQuickModalOpen, quickEdit.productId]);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timer = setTimeout(() => {
      setFeedback(null);
    }, 4000);

    return () => {
      clearTimeout(timer);
    };
  }, [feedback]);

  const effectiveSummary = useMemo<StockAlertSummary>(
    () => summary ?? { critical: 0, warning: 0, total: 0 },
    [summary]
  );

  const activeAlert = useMemo<StockAlertItem | null>(() => {
    if (!quickEdit.productId) {
      return null;
    }

    return alerts.find((item) => item.productId === quickEdit.productId) ?? null;
  }, [alerts, quickEdit.productId]);

  const handleLevelChange = (value: string | number) => {
    const nextValue = value as LevelFilter;
    setFilters((prev) => ({ ...prev, level: nextValue }));
  };

  const handleSearchSubmit = () => {
    setFilters((prev) => ({ ...prev, search: searchDraft.trim() }));
  };

  const handleSearchClear = () => {
    setSearchDraft("");
    setFilters((prev) => ({ ...prev, search: "" }));
  };

  const handleOpenQuickEdit = (item: StockAlertItem) => {
    setQuickEdit({
      productId: item.productId,
      stock: item.stock.toString(),
      individualPrice: formatPriceInput(item.individualPrice),
      corporatePrice: formatPriceInput(item.corporatePrice),
    });
    setIsQuickModalOpen(true);
  };

  const handleCloseQuickEdit = () => {
    setIsQuickModalOpen(false);
    setQuickEdit({ productId: null, stock: "", individualPrice: "", corporatePrice: "" });
  };

  const handleQuickFieldChange = (
    field: "stock" | "individualPrice" | "corporatePrice",
    value: string
  ) => {
    if (field === "stock") {
      if (!/^\d*$/.test(value)) {
        return;
      }
    } else if (!/^\d*(\.\d{0,2})?$/.test(value)) {
      return;
    }

    setQuickEdit((prev) => ({ ...prev, [field]: value }));
  };

  const handleQuickSave = async () => {
    if (!quickEdit.productId) {
      return;
    }

    const payload: {
      stock?: number;
      individualPrice?: number;
      corporatePrice?: number;
    } = {};

    if (quickEdit.stock.trim() !== "") {
      const stockValue = Number(quickEdit.stock);
      if (!Number.isFinite(stockValue) || stockValue < 0) {
        setFeedback({ message: "Geçerli stok değeri girin", type: "error" });
        return;
      }
      payload.stock = Math.floor(stockValue);
    }

    if (quickEdit.individualPrice.trim() !== "") {
      const priceValue = Number(quickEdit.individualPrice);
      if (!Number.isFinite(priceValue) || priceValue < 0) {
        setFeedback({ message: "Geçerli bireysel fiyat girin", type: "error" });
        return;
      }
      payload.individualPrice = priceValue;
    }

    if (quickEdit.corporatePrice.trim() !== "") {
      const priceValue = Number(quickEdit.corporatePrice);
      if (!Number.isFinite(priceValue) || priceValue < 0) {
        setFeedback({ message: "Geçerli kurumsal fiyat girin", type: "error" });
        return;
      }
      payload.corporatePrice = priceValue;
    }

    if (Object.keys(payload).length === 0) {
      setFeedback({ message: "Güncelleme için değer girin", type: "error" });
      return;
    }

    setIsQuickSaving(true);
    setFeedback(null);

    try {
      await updateProductQuickSettings(quickEdit.productId, payload);
      setFeedback({ message: "Bilgiler güncellendi", type: "success" });
      handleCloseQuickEdit();
      await loadAlerts();
    } catch (err) {
      setFeedback({
        message: err instanceof Error ? err.message : "Güncelleme başarısız",
        type: "error",
      });
    } finally {
      setIsQuickSaving(false);
    }
  };

  if (error) {
    return (
      <Card className="border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
        <CardBody className="flex flex-col items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-red-500" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <Button size="sm" color="danger" variant="flat" onPress={() => void loadAlerts()}>
            Tekrar Dene
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardBody className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Select
                size="sm"
                className="w-56"
                selectedKeys={[filters.level]}
                onSelectionChange={(selection) => {
                  const [value] = Array.from(selection);
                  handleLevelChange(value ?? "all");
                }}
                aria-label="Seviye filtresi"
              >
                {LEVEL_OPTIONS.map((option) => (
                  <SelectItem key={option.key} value={option.key} textValue={option.label}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>
              <div className="flex max-w-sm items-center gap-2">
                <Input
                  size="sm"
                  value={searchDraft}
                  onValueChange={setSearchDraft}
                  placeholder="Ürün adı veya kodu"
                  startContent={<Search className="h-4 w-4 text-slate-400" />}
                  onClear={handleSearchClear}
                  isClearable
                  aria-label="Stok arama"
                />
                <Button
                  size="sm"
                  variant="flat"
                  onPress={handleSearchSubmit}
                  isDisabled={isLoading}
                >
                  Ara
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="flat"
                startContent={<RefreshCw className="h-4 w-4" />}
                onPress={() => void loadAlerts()}
                isDisabled={isLoading}
              >
                Yenile
              </Button>
            </div>
          </div>
          <Divider />
          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryCard
              title="Kritik"
              value={effectiveSummary.critical}
              color="danger"
            />
            <SummaryCard
              title="Uyarı"
              value={effectiveSummary.warning}
              color="warning"
            />
            <SummaryCard
              title="Toplam"
              value={effectiveSummary.total}
              color="primary"
            />
          </div>
        {feedback && (
          <div
            className={`rounded-lg px-3 py-2 text-sm ${
              feedback.type === "success"
                ? "bg-green-50 text-green-600 dark:bg-green-950/60 dark:text-green-400"
                : "bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400"
            }`}
          >
            {feedback.message}
          </div>
        )}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          <Table
            aria-label="Stok uyarıları"
            isHeaderSticky
            selectionMode="none"
            classNames={{ table: "min-w-full" }}
          >
            <TableHeader>
              <TableColumn width={120}>SEVİYE</TableColumn>
              <TableColumn>ÜRÜN</TableColumn>
              <TableColumn width={140}>ÜRÜN KODU</TableColumn>
              <TableColumn width={100}>STOK</TableColumn>
              <TableColumn width={110}>EŞİK</TableColumn>
              <TableColumn width={110}>EKSİK</TableColumn>
              <TableColumn width={140}>ÖNERİLEN STOĞA ÇEK</TableColumn>
              <TableColumn width={160}>SON GÜNCELLEME</TableColumn>
              <TableColumn width={140}>HIZLI İŞLEM</TableColumn>
            </TableHeader>
            <TableBody
              items={alerts}
              isLoading={isLoading}
              loadingContent={<Spinner label="Veriler yükleniyor" />}
              emptyContent="Kritik stok uyarısı yok"
            >
              {(alert) => (
                <TableRow key={alert.productId}>
                  <TableCell>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={LEVEL_COLOR[alert.level]}
                    >
                      {LEVEL_LABEL[alert.level]}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {alert.productName}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Min. Bireysel: {formatNumber(alert.minQuantityIndividual)} | Min. Kurumsal: {formatNumber(alert.minQuantityCorporate)}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Bireysel: {formatPriceDisplay(alert.individualPrice)} ₺ | Kurumsal: {formatPriceDisplay(alert.corporatePrice)} ₺
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                      {alert.productCode}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat" color={alert.stock > 0 ? "warning" : "danger"}>
                      {formatNumber(alert.stock)}
                    </Chip>
                  </TableCell>
                  <TableCell>{formatNumber(alert.threshold)}</TableCell>
                  <TableCell>{formatNumber(alert.deficit)}</TableCell>
                  <TableCell>{formatNumber(alert.restockSuggestion)}</TableCell>
                  <TableCell>{formatDate(alert.updatedAt)}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="flat"
                      startContent={<Pencil className="h-4 w-4" />}
                      onPress={() => handleOpenQuickEdit(alert)}
                    >
                      Düzenle
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
      <Modal isOpen={isQuickModalOpen} onClose={handleCloseQuickEdit} size="sm">
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-left">
                <span className="text-base font-semibold text-slate-900 dark:text-white">
                  Hızlı Ürün Ayarları
                </span>
                {activeAlert ? (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {activeAlert.productName} · {activeAlert.productCode}
                  </span>
                ) : null}
              </ModalHeader>
              <ModalBody className="space-y-3">
                <Input
                  size="sm"
                  label="Stok"
                  type="number"
                  min={0}
                  value={quickEdit.stock}
                  onValueChange={(value) => handleQuickFieldChange("stock", value)}
                />
                <Input
                  size="sm"
                  label="Bireysel Fiyat"
                  type="number"
                  min={0}
                  step={0.01}
                  value={quickEdit.individualPrice}
                  onValueChange={(value) => handleQuickFieldChange("individualPrice", value)}
                />
                <Input
                  size="sm"
                  label="Kurumsal Fiyat"
                  type="number"
                  min={0}
                  step={0.01}
                  value={quickEdit.corporatePrice}
                  onValueChange={(value) => handleQuickFieldChange("corporatePrice", value)}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={handleCloseQuickEdit}>
                  İptal
                </Button>
                <Button color="primary" isLoading={isQuickSaving} onPress={() => void handleQuickSave()}>
                  Kaydet
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

const SummaryCard = ({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: "primary" | "danger" | "warning";
}) => (
  <Card className="bg-slate-50 dark:bg-[#161616]">
    <CardBody className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </span>
      <span className="text-2xl font-semibold text-slate-900 dark:text-white">
        {formatNumber(value)}
      </span>
      <Chip
        size="sm"
        variant="flat"
        color={color}
        className="w-fit"
      >
        Uyarı
      </Chip>
    </CardBody>
  </Card>
);

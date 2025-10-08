import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Select,
  SelectItem,
  Spinner,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  Input,
  Divider,
  Textarea,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  type Selection,
} from "@heroui/react";
import { Download, Package, RefreshCw } from "lucide-react";
import {
  downloadOrderInvoice,
  exportOrders,
  getOrders,
  updateOrderPaymentStatus,
  updateOrderStatus,
} from "../../api/orders";
import type { Order, OrderFilters, OrdersResponse, UpdateOrderStatusInput } from "../../api/orders";
import { API_BASE_URL } from "../../config/env";
import { useToast } from "../../hooks/useToast";

const ORDER_STATUSES = [
  { value: "pending", label: "Beklemede", color: "warning" },
  { value: "confirmed", label: "Onaylandı", color: "primary" },
  { value: "preparing", label: "Hazırlanıyor", color: "secondary" },
  { value: "shipped", label: "Kargoda", color: "success" },
  { value: "delivered", label: "Teslim Edildi", color: "success" },
  { value: "cancelled", label: "İptal", color: "danger" },
];

const PAYMENT_STATUSES = [
  { value: "pending", label: "Beklemede", color: "warning" },
  { value: "processing", label: "İşleniyor", color: "primary" },
  { value: "requires_action", label: "Ek Doğrulama Gerekli", color: "warning" },
  { value: "succeeded", label: "Başarılı", color: "success" },
  { value: "completed", label: "Tamamlandı", color: "success" },
  { value: "failed", label: "Başarısız", color: "danger" },
  { value: "canceled", label: "İptal", color: "danger" },
];

const MANUAL_PAYMENT_STATUS_VALUES = new Set([
  "pending",
  "processing",
  "requires_action",
  "succeeded",
  "completed",
  "failed",
  "canceled",
]);

const PAYMENT_STATUS_UPDATE_OPTIONS = PAYMENT_STATUSES.filter((status) =>
  MANUAL_PAYMENT_STATUS_VALUES.has(status.value)
);

const LEGACY_SHIPPING_COMPANY = "dhl express";

const isLegacyShippingCompany = (value: string | null | undefined): boolean =>
  typeof value === "string" && value.trim().toLowerCase() === LEGACY_SHIPPING_COMPANY;

const sanitizeShippingCompanyForForm = (
  value: string | null | undefined
): string => {
  if (!value) {
    return "";
  }

  return isLegacyShippingCompany(value) ? "" : value;
};

const toDateTimeLocalInput = (value: string | null): string => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (num: number) => num.toString().padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toIsoStringFromInput = (value: string | null | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
};

const normalizeOptionalString = (value: string | null | undefined): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeOptionalDateTime = (
  value: string | null | undefined
): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const isoString = toIsoStringFromInput(value);
  return isoString ?? null;
};

const formatPaymentMethod = (method: string | null): string => {
  if (!method) {
    return "Belirtilmedi";
  }

  switch (method.toLowerCase()) {
    case "card":
      return "Kredi Kartı";
    case "apple_pay":
      return "Apple Pay";
    case "google_pay":
      return "Google Pay";
    case "bank_transfer":
      return "Banka Havalesi";
    case "cash":
      return "Nakit";
    default:
      return method;
  }
};

const formatUserType = (type: Order["userType"]): string => {
  return type === "corporate" ? "Kurumsal" : "Bireysel";
};

const resolveResourceUrl = (resourcePath: string): string => {
  if (resourcePath.startsWith("http")) {
    return resourcePath;
  }

  const sanitizedPath = resourcePath.startsWith("./")
    ? resourcePath.replace(/^\.\//, "/")
    : resourcePath.startsWith("/")
      ? resourcePath
      : `/${resourcePath}`;

  return `${API_BASE_URL}${sanitizedPath}`;
};

export const OrderManager = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<OrderFilters>({});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [invoicePreviewOpen, setInvoicePreviewOpen] = useState(false);
  const [invoicePreviewUrl, setInvoicePreviewUrl] = useState<string | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [logisticsForm, setLogisticsForm] = useState({
    trackingNumber: "",
    shippingCompany: "",
    estimatedDelivery: "",
    notes: "",
  });
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set<string>());

  const selectedOrders = useMemo(
    () => orders.filter((order) => selectedOrderIds.has(order.id)),
    [orders, selectedOrderIds]
  );
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [exportingFormat, setExportingFormat] = useState<"csv" | "xlsx" | null>(null);
  const { showToast } = useToast();

  const areSetsEqual = useCallback((a: Set<string>, b: Set<string>) => {
    if (a.size !== b.size) {
      return false;
    }
    for (const value of a) {
      if (!b.has(value)) {
        return false;
      }
    }
    return true;
  }, []);

  useEffect(() => {
    const availableIds = new Set(orders.map((order) => order.id));
    const filtered = new Set<string>(Array.from(selectedOrderIds).filter((id) => availableIds.has(id)));
    if (!areSetsEqual(filtered, selectedOrderIds)) {
      setSelectedOrderIds(filtered);
    }
  }, [areSetsEqual, orders, selectedOrderIds]);

  const clearOrderSelection = useCallback(() => {
    setSelectedOrderIds(new Set<string>());
  }, []);

  const handleOrderSelectionChange = useCallback(
    (keys: Selection) => {
      const normalized =
        keys === "all"
          ? new Set<string>(orders.map((order) => order.id))
          : new Set<string>(Array.from(keys as Set<string>));
      setSelectedOrderIds(normalized);
    },
    [orders]
  );

  const handleOpenFirstSelected = useCallback(() => {
    const [first] = selectedOrders;
    if (!first) {
      return;
    }
    setSelectedOrder(first);
    setDrawerOpen(true);
  }, [selectedOrders]);

  useEffect(() => {
    loadOrders();
  }, [filters]);

  useEffect(() => {
    setInvoicePreviewOpen(false);
    if (invoicePreviewUrl) {
      URL.revokeObjectURL(invoicePreviewUrl);
      setInvoicePreviewUrl(null);
    }
  }, [selectedOrder?.id]);

  useEffect(() => {
    if (!invoicePreviewOpen && invoicePreviewUrl) {
      URL.revokeObjectURL(invoicePreviewUrl);
      setInvoicePreviewUrl(null);
    }
  }, [invoicePreviewOpen, invoicePreviewUrl]);

  useEffect(() => {
    if (!selectedOrder) {
      setLogisticsForm({
        trackingNumber: "",
        shippingCompany: "",
        estimatedDelivery: "",
        notes: "",
      });
      setCancelReason("");
      setPendingStatus(null);
      setIsCancelModalOpen(false);
      return;
    }

    setLogisticsForm({
      trackingNumber: selectedOrder.trackingNumber ?? "",
      shippingCompany: sanitizeShippingCompanyForForm(selectedOrder.shippingCompany),
      estimatedDelivery: toDateTimeLocalInput(selectedOrder.estimatedDelivery),
      notes: selectedOrder.notes ?? "",
    });
    setCancelReason(selectedOrder.cancelReason ?? "");
    setPendingStatus(null);
    setIsCancelModalOpen(false);
  }, [selectedOrder]);

  const invoiceAvailable = Boolean(selectedOrder?.invoiceGeneratedAt || selectedOrder?.invoicePdfPath);

  const loadOrders = async (): Promise<OrdersResponse | undefined> => {
    try {
      setLoading(true);
      const response = await getOrders(filters);
      setOrders(response.orders);
      return response;
    } catch (error) {
      console.error("Siparişler yüklenemedi:", error);
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  const handleExportOrders = async (format: "csv" | "xlsx") => {
    try {
      setExportingFormat(format);
      const blob = await exportOrders({
        format,
        status: filters.status,
        paymentStatus: filters.paymentStatus,
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      link.href = url;
      link.download = `orders-${timestamp}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast({
        type: "success",
        title: format === "xlsx" ? "Siparişler Excel olarak indirildi" : "Siparişler CSV olarak indirildi",
        duration: 3000,
      });
    } catch (error) {
      console.error("Siparişler indirilemedi:", error);
      showToast({
        type: "error",
        title: "Sipariş dışa aktarma başarısız",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setExportingFormat(null);
    }
  };

  const handleStatusUpdate = async (
    orderId: string,
    input: UpdateOrderStatusInput,
    options?: { keepOpen?: boolean }
  ) => {
    try {
      setUpdatingStatus(true);
      const payload: UpdateOrderStatusInput = {
        status: input.status,
      };

      const resolveStringField = (
        primary: string | null | undefined,
        fallback: string
      ): string | null | undefined => {
        if (primary !== undefined) {
          return normalizeOptionalString(primary);
        }

        const normalizedFallback = normalizeOptionalString(fallback);
        return normalizedFallback === null ? undefined : normalizedFallback;
      };

      const resolveDateField = (
        primary: string | null | undefined,
        fallback: string
      ): string | null | undefined => {
        if (primary !== undefined) {
          return normalizeOptionalDateTime(primary);
        }

        const trimmedFallback = fallback.trim();
        if (trimmedFallback.length === 0) {
          return undefined;
        }

        const normalizedFallback = normalizeOptionalDateTime(trimmedFallback);
        return normalizedFallback ?? null;
      };

      const resolvedTracking = resolveStringField(
        input.trackingNumber,
        logisticsForm.trackingNumber
      );
      if (resolvedTracking !== undefined) {
        payload.trackingNumber = resolvedTracking;
      }

      const resolvedShipping = resolveStringField(
        input.shippingCompany,
        logisticsForm.shippingCompany
      );
      if (resolvedShipping !== undefined) {
        payload.shippingCompany = resolvedShipping;
      }

      const resolvedEstimated = resolveDateField(
        input.estimatedDelivery,
        logisticsForm.estimatedDelivery
      );
      if (resolvedEstimated !== undefined) {
        payload.estimatedDelivery = resolvedEstimated;
      }

      const resolvedNotes = resolveStringField(
        input.notes,
        logisticsForm.notes
      );
      if (resolvedNotes !== undefined) {
        payload.notes = resolvedNotes;
      }

      const resolvedCancel = resolveStringField(
        input.cancelReason,
        cancelReason
      );
      if (resolvedCancel !== undefined) {
        payload.cancelReason = resolvedCancel;
      }

      await updateOrderStatus(orderId, payload);
      const refreshed = await loadOrders();

      if (options?.keepOpen) {
        const updatedOrder = refreshed?.orders.find((order) => order.id === orderId) ?? null;
        setSelectedOrder(updatedOrder);
        return;
      }

      setDrawerOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error("Sipariş durumu güncellenemedi:", error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePaymentStatusUpdate = async (orderId: string, paymentStatus: string) => {
    if (!MANUAL_PAYMENT_STATUS_VALUES.has(paymentStatus)) {
      return;
    }

    try {
      setUpdatingStatus(true);
      await updateOrderPaymentStatus(orderId, { paymentStatus });
      await loadOrders();
      setDrawerOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error("Ödeme durumu güncellenemedi:", error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDetailsSave = async () => {
    if (!selectedOrder) {
      return;
    }

    await handleStatusUpdate(
      selectedOrder.id,
      {
        status: selectedOrder.status,
        trackingNumber: normalizeOptionalString(logisticsForm.trackingNumber),
        shippingCompany: normalizeOptionalString(logisticsForm.shippingCompany),
        estimatedDelivery: normalizeOptionalDateTime(logisticsForm.estimatedDelivery),
        notes: normalizeOptionalString(logisticsForm.notes),
        cancelReason: normalizeOptionalString(cancelReason),
      },
      { keepOpen: true }
    );
  };

  const getStatusChip = (status: string) => {
    const statusObj = ORDER_STATUSES.find((s) => s.value === status);
    return (
      <Chip color={statusObj?.color as "warning" | "primary" | "secondary" | "success" | "danger"} size="sm" variant="flat">
        {statusObj?.label || status}
      </Chip>
    );
  };

  const getPaymentStatusChip = (status: string) => {
    const statusObj = PAYMENT_STATUSES.find((s) => s.value === status);
    return (
      <Chip color={statusObj?.color as "warning" | "success" | "primary" | "danger"} size="sm" variant="flat">
        {statusObj?.label || status}
      </Chip>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleInvoiceDownload = async (order: Order) => {
    if (typeof document === "undefined") {
      return;
    }

    try {
      setInvoiceLoading(true);
      const blob = await downloadOrderInvoice(order.id);
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${order.orderNumber}-fatura.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Fatura indirilemedi:", error);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleInvoicePreview = async (order: Order) => {
    try {
      setInvoiceLoading(true);
      const blob = await downloadOrderInvoice(order.id);
      const url = URL.createObjectURL(blob);
      if (invoicePreviewUrl) {
        URL.revokeObjectURL(invoicePreviewUrl);
      }
      setInvoicePreviewUrl(url);
      setInvoicePreviewOpen(true);
    } catch (error) {
      console.error("Fatura önizlemesi açılamadı:", error);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleInvoiceShare = async (order: Order) => {
    const nav = typeof window !== "undefined" ? window.navigator : undefined;
    const shareUrl = `${API_BASE_URL}/api/admin/orders/${order.id}/invoice`;

    try {
      if (nav && typeof nav.share === "function") {
        await nav.share({
          title: `Fatura ${order.orderNumber}`,
          url: shareUrl,
        });
        return;
      }

      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(shareUrl);
        showToast({
          type: "success",
          title: "Bağlantı kopyalandı",
          description: "Fatura bağlantısı panoya kopyalandı.",
        });
        return;
      }
    } catch (error) {
      console.error("Fatura paylaşımı başarısız:", error);
      showToast({
        type: "error",
        title: "Paylaşım başarısız",
        description: error instanceof Error ? error.message : undefined,
      });
    }

    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  const canUpdatePaymentStatus =
    selectedOrder?.paymentMethodType === "bank_transfer" && selectedOrder?.userType === "corporate";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Siparişler</h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="flat"
              startContent={<Download className="h-4 w-4" />}
              onPress={() => void handleExportOrders("csv")}
              isLoading={exportingFormat === "csv"}
            >
              CSV İndir
            </Button>
            <Button
              variant="flat"
              startContent={<Download className="h-4 w-4" />}
              onPress={() => void handleExportOrders("xlsx")}
              isLoading={exportingFormat === "xlsx"}
            >
              Excel İndir
            </Button>
          </div>
          <Button
            startContent={<RefreshCw className="h-4 w-4" />}
            onPress={loadOrders}
            isLoading={loading}
            variant="flat"
          >
            Yenile
          </Button>
        </div>
      </div>

      <Card className="dark:bg-[#1a1a1a] dark:border dark:border-[#2a2a2a]">
        <CardBody className="gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Select
              label="Sipariş Durumu"
              placeholder="Tümü"
              selectedKeys={filters.status ? new Set<Selection>([filters.status]) : new Set()}
              onSelectionChange={(keys) => {
                if (keys === "all" || keys.size === 0) {
                  setFilters({ ...filters, status: undefined });
                  return;
                }

                const [value] = keys;
                setFilters({ ...filters, status: value as string });
              }}
              classNames={{
                trigger: "dark:bg-[#0a0a0a] dark:border-[#2a2a2a]",
              }}
            >
              {ORDER_STATUSES.map((status) => (
                <SelectItem key={status.value}>{status.label}</SelectItem>
              ))}
            </Select>

            <Select
              label="Ödeme Durumu"
              placeholder="Tümü"
              selectedKeys={filters.paymentStatus ? new Set<Selection>([filters.paymentStatus]) : new Set()}
              onSelectionChange={(keys) => {
                if (keys === "all" || keys.size === 0) {
                  setFilters({ ...filters, paymentStatus: undefined });
                  return;
                }

                const [value] = keys;
                setFilters({ ...filters, paymentStatus: value as string });
              }}
              classNames={{
                trigger: "dark:bg-[#0a0a0a] dark:border-[#2a2a2a]",
              }}
            >
              {PAYMENT_STATUSES.map((status) => (
                <SelectItem key={status.value}>{status.label}</SelectItem>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>
      {selectedOrders.length > 0 ? (
        <Card className="dark:bg-[#1a1a1a] dark:border dark:border-[#2a2a2a]">
          <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Seçilen sipariş: {selectedOrders.length}
            </span>
            <div className="flex flex-wrap gap-2">
              <Button variant="flat" onPress={clearOrderSelection}>
                Seçimi Temizle
              </Button>
              <Button color="primary" variant="solid" onPress={handleOpenFirstSelected}>
                İlkini Aç
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : null}

      <Card className="dark:bg-[#1a1a1a] dark:border dark:border-[#2a2a2a]">
        <CardBody>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner size="lg" color="primary" />
            </div>
          ) : (
            <Table
              aria-label="Siparişler tablosu"
              selectionMode="multiple"
              selectedKeys={selectedOrderIds}
              onSelectionChange={handleOrderSelectionChange}
            >
              <TableHeader>
                <TableColumn>SİPARİŞ NO</TableColumn>
                <TableColumn>MÜŞTERİ</TableColumn>
                <TableColumn>TUTAR</TableColumn>
                <TableColumn>ÜRÜN SAYISI</TableColumn>
                <TableColumn>DURUM</TableColumn>
                <TableColumn>ÖDEME</TableColumn>
                <TableColumn>TARİH</TableColumn>
                <TableColumn>İŞLEM</TableColumn>
              </TableHeader>
              <TableBody emptyContent="Sipariş bulunamadı">
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <span className="font-mono text-xs">{order.orderNumber}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{order.customerName}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{order.shippingCity}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{order.totalAmount} {order.currency}</span>
                    </TableCell>
                    <TableCell>{order.itemCount}</TableCell>
                    <TableCell>{getStatusChip(order.status)}</TableCell>
                    <TableCell>{getPaymentStatusChip(order.paymentStatus)}</TableCell>
                    <TableCell>
                      <span className="text-xs">{formatDate(order.createdAt)}</span>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => {
                          setSelectedOrder(order);
                          setDrawerOpen(true);
                        }}
                      >
                        Detay
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} size="2xl" placement="right">
        <DrawerContent>
          <DrawerHeader className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">Sipariş Detayı</h3>
            {selectedOrder && (
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {selectedOrder.orderNumber}
              </span>
            )}
          </DrawerHeader>
          <DrawerBody>
            {selectedOrder && (
              <div className="space-y-6">
                <div>
                  <h4 className="mb-3 text-sm font-semibold">Müşteri Bilgileri</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Ad Soyad:</span>{" "}
                      <span className="font-medium">{selectedOrder.customerName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">E-posta:</span>{" "}
                      <span className="font-medium">{selectedOrder.customerEmail}</span>
                    </div>
                    {selectedOrder.customerPhone && (
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Telefon:</span>{" "}
                        <span className="font-medium">{selectedOrder.customerPhone}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Şehir:</span>{" "}
                      <span className="font-medium">{selectedOrder.shippingCity}</span>
                    </div>
                  </div>
                </div>

                <Divider />

                <div>
                  <h4 className="mb-3 text-sm font-semibold">Sipariş Bilgileri</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400">Sipariş Durumu:</span>
                      {getStatusChip(selectedOrder.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400">Ödeme Durumu:</span>
                      {getPaymentStatusChip(selectedOrder.paymentStatus)}
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Ödeme Yöntemi:</span>{" "}
                      <span className="font-medium">{formatPaymentMethod(selectedOrder.paymentMethodType)}</span>
                    </div>
                    {selectedOrder.userType === "corporate" &&
                     selectedOrder.paymentMethodType === "bank_transfer" &&
                     selectedOrder.paymentTermDays !== null && (
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Ödeme Vadesi:</span>{" "}
                        <span className="font-medium">{selectedOrder.paymentTermDays} gün</span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Kullanıcı Tipi:</span>{" "}
                      <span className="font-medium">{formatUserType(selectedOrder.userType)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Sipariş Tarihi:</span>{" "}
                      <span className="font-medium">{formatDate(selectedOrder.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Toplam Tutar:</span>{" "}
                      <span className="font-medium">{selectedOrder.totalAmount} {selectedOrder.currency}</span>
                    </div>
                  </div>
                </div>

                <Divider />

                <div>
                  <h4 className="mb-3 text-sm font-semibold">Fatura</h4>
                  <div className="space-y-2 text-sm">
                    {selectedOrder.invoiceGeneratedAt && (
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Oluşturulma:</span>{" "}
                        <span className="font-medium">{formatDate(selectedOrder.invoiceGeneratedAt)}</span>
                      </div>
                    )}
                    {!invoiceAvailable && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Fatura henüz oluşturulmadı. Aşağıdaki aksiyonlar otomatik olarak Fakturownia üzerinden fatura oluşturur.
                      </span>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => {
                          if (selectedOrder) {
                            void handleInvoicePreview(selectedOrder);
                          }
                        }}
                        isDisabled={invoiceLoading}
                      >
                        Önizle
                      </Button>
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => {
                          if (selectedOrder) {
                            void handleInvoiceDownload(selectedOrder);
                          }
                        }}
                        isDisabled={invoiceLoading}
                      >
                        İndir
                      </Button>
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => {
                          if (selectedOrder) {
                            void handleInvoiceShare(selectedOrder);
                          }
                        }}
                        isDisabled={invoiceLoading}
                      >
                        Paylaş
                      </Button>
                    </div>
                  </div>
                </div>

                <Divider />

                <div>
                  <h4 className="mb-3 text-sm font-semibold">Ürünler</h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 dark:border-[#2a2a2a]">
                        {item.productImage && (
                          <img
                            src={resolveResourceUrl(item.productImage)}
                            alt={item.productName}
                            className="h-12 w-12 rounded object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <div className="text-sm font-medium">{item.productName}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {item.quantity} x {item.unitPrice} {selectedOrder.currency}
                          </div>
                        </div>
                        <div className="text-sm font-semibold">
                          {item.totalPrice} {selectedOrder.currency}
                        </div>
                      </div>
                    ))}
                  </div>
                  </div>

                <Divider />

                <div>
                  <h4 className="mb-3 text-sm font-semibold">Teslimat ve Notlar</h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input
                      label="Takip Numarası"
                      variant="bordered"
                      value={logisticsForm.trackingNumber}
                      onValueChange={(value) => {
                        setLogisticsForm((current) => ({
                          ...current,
                          trackingNumber: value,
                        }));
                      }}
                      isDisabled={updatingStatus}
                    />
                    <Input
                      label="Kargo Firması"
                      variant="bordered"
                      value={logisticsForm.shippingCompany}
                      onValueChange={(value) => {
                        setLogisticsForm((current) => ({
                          ...current,
                          shippingCompany: value,
                        }));
                      }}
                      isDisabled={updatingStatus}
                    />
                    <Input
                      label="Tahmini Teslimat"
                      type="datetime-local"
                      variant="bordered"
                      value={logisticsForm.estimatedDelivery}
                      onValueChange={(value) => {
                        setLogisticsForm((current) => ({
                          ...current,
                          estimatedDelivery: value,
                        }));
                      }}
                      isDisabled={updatingStatus}
                    />
                    <Textarea
                      label="Sipariş Notları"
                      minRows={3}
                      variant="bordered"
                      value={logisticsForm.notes}
                      onValueChange={(value) => {
                        setLogisticsForm((current) => ({
                          ...current,
                          notes: value,
                        }));
                      }}
                      isDisabled={updatingStatus}
                    />
                    <Textarea
                      label="İptal Nedeni"
                      minRows={3}
                      variant="bordered"
                      value={cancelReason}
                      onValueChange={(value) => {
                        setCancelReason(value);
                      }}
                      isDisabled={updatingStatus}
                    />
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="flat"
                      onPress={() => {
                        void handleDetailsSave();
                      }}
                      isLoading={updatingStatus}
                    >
                      Detayları Kaydet
                    </Button>
                  </div>
                </div>

                <Divider />

                <div>
                  <h4 className="mb-3 text-sm font-semibold">Durumu Güncelle</h4>
                  <div className="flex flex-wrap items-end gap-4">
                    <Select
                      aria-label="Sipariş Durumu"
                      label="Sipariş Durumu"
                      selectedKeys={new Set<Selection>([selectedOrder.status])}
                      onSelectionChange={(keys) => {
                        if (keys === "all" || keys.size === 0) {
                          return;
                        }

                        const [value] = keys;
                        const nextStatus = value as string;

                        if (nextStatus === selectedOrder.status) {
                          return;
                        }

                        if (nextStatus === "cancelled") {
                          setPendingStatus(nextStatus);
                          setIsCancelModalOpen(true);
                          return;
                        }

                        void handleStatusUpdate(selectedOrder.id, { status: nextStatus });
                      }}
                      isDisabled={updatingStatus}
                      classNames={{
                        trigger: "dark:bg-[#0a0a0a] dark:border-[#2a2a2a] min-w-[220px]",
                      }}
                    >
                      {ORDER_STATUSES.map((status) => (
                        <SelectItem key={status.value}>{status.label}</SelectItem>
                      ))}
                    </Select>
                    {canUpdatePaymentStatus && (
                      <Select
                        aria-label="Ödeme Durumu"
                        label="Ödeme Durumu"
                        selectedKeys={new Set<Selection>([selectedOrder.paymentStatus])}
                        onSelectionChange={(keys) => {
                          if (keys === "all" || keys.size === 0) {
                            return;
                          }

                          const [value] = keys;
                          void handlePaymentStatusUpdate(selectedOrder.id, value as string);
                        }}
                        isDisabled={updatingStatus}
                        classNames={{
                          trigger: "dark:bg-[#0a0a0a] dark:border-[#2a2a2a] min-w-[220px]",
                        }}
                      >
                        {PAYMENT_STATUS_UPDATE_OPTIONS.map((status) => (
                          <SelectItem key={status.value}>{status.label}</SelectItem>
                        ))}
                      </Select>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Modal isOpen={invoicePreviewOpen && !!invoicePreviewUrl} onClose={() => setInvoicePreviewOpen(false)} size="4xl">
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader>Fatura Önizleme</ModalHeader>
              <ModalBody>
                {invoicePreviewUrl ? (
                  <iframe
                    src={`${invoicePreviewUrl}#toolbar=0`}
                    title="Fatura Önizleme"
                    className="h-[70vh] w-full rounded border border-slate-200 dark:border-[#2a2a2a]"
                  />
                ) : (
                  <span className="text-sm text-slate-500 dark:text-slate-400">Fatura bulunamadı.</span>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={close}>
                  Kapat
                </Button>
                {selectedOrder && (
                  <Button
                    variant="flat"
                    onPress={() => {
                      if (selectedOrder) {
                        void handleInvoiceDownload(selectedOrder);
                      }
                    }}
                    isDisabled={invoiceLoading}
                  >
                    İndir
                  </Button>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)}>
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader>Siparişi İptal Et</ModalHeader>
              <ModalBody className="space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  İptal nedenini belirterek müşteriye bilgilendirme sağlayabilirsiniz.
                </p>
                <Textarea
                  label="İptal Nedeni"
                  minRows={3}
                  variant="bordered"
                  value={cancelReason}
                  onValueChange={(value) => {
                    setCancelReason(value);
                  }}
                  isDisabled={updatingStatus}
                />
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  onPress={() => {
                    setIsCancelModalOpen(false);
                    setPendingStatus(null);
                    close();
                  }}
                  isDisabled={updatingStatus}
                >
                  Vazgeç
                </Button>
                <Button
                  color="danger"
                  onPress={() => {
                    if (!selectedOrder || !pendingStatus) {
                      setIsCancelModalOpen(false);
                      setPendingStatus(null);
                      close();
                      return;
                    }

                    setIsCancelModalOpen(false);
                    const statusToApply = pendingStatus;
                    setPendingStatus(null);
                    void handleStatusUpdate(selectedOrder.id, {
                      status: statusToApply,
                      cancelReason,
                    });
                    close();
                  }}
                  isLoading={updatingStatus}
                >
                  Onayla
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

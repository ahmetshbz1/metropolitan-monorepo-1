import { useEffect, useState } from "react";
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
} from "@heroui/react";
import { Package, Search, RefreshCw } from "lucide-react";
import { getOrders, updateOrderStatus } from "../../api/orders";
import type { Order, OrderFilters, UpdateOrderStatusInput } from "../../api/orders";

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
  { value: "succeeded", label: "Başarılı", color: "success" },
  { value: "processing", label: "İşleniyor", color: "primary" },
  { value: "canceled", label: "İptal", color: "danger" },
];

export const OrderManager = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<OrderFilters>({});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [filters]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await getOrders(filters);
      setOrders(response.orders);
    } catch (error) {
      console.error("Siparişler yüklenemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, input: UpdateOrderStatusInput) => {
    try {
      setUpdatingStatus(true);
      await updateOrderStatus(orderId, input);
      await loadOrders();
      setDrawerOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error("Sipariş durumu güncellenemedi:", error);
    } finally {
      setUpdatingStatus(false);
    }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Siparişler</h1>
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

      <Card className="dark:bg-[#1a1a1a] dark:border dark:border-[#2a2a2a]">
        <CardBody className="gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Select
              label="Sipariş Durumu"
              placeholder="Tümü"
              selectedKeys={filters.status ? [filters.status] : []}
              onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
              classNames={{
                trigger: "dark:bg-[#0a0a0a] dark:border-[#2a2a2a]",
              }}
            >
              {ORDER_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </Select>

            <Select
              label="Ödeme Durumu"
              placeholder="Tümü"
              selectedKeys={filters.paymentStatus ? [filters.paymentStatus] : []}
              onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value || undefined })}
              classNames={{
                trigger: "dark:bg-[#0a0a0a] dark:border-[#2a2a2a]",
              }}
            >
              {PAYMENT_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      <Card className="dark:bg-[#1a1a1a] dark:border dark:border-[#2a2a2a]">
        <CardBody>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner size="lg" color="primary" />
            </div>
          ) : (
            <Table aria-label="Siparişler tablosu">
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
                  <h4 className="mb-3 text-sm font-semibold">Ürünler</h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 dark:border-[#2a2a2a]">
                        {item.productImage && (
                          <img
                            src={`${import.meta.env.VITE_API_BASE_URL}${item.productImage}`}
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
                  <h4 className="mb-3 text-sm font-semibold">Durumu Güncelle</h4>
                  <Select
                    label="Sipariş Durumu"
                    defaultSelectedKeys={[selectedOrder.status]}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleStatusUpdate(selectedOrder.id, { status: e.target.value });
                      }
                    }}
                    isDisabled={updatingStatus}
                    classNames={{
                      trigger: "dark:bg-[#0a0a0a] dark:border-[#2a2a2a]",
                    }}
                  >
                    {ORDER_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

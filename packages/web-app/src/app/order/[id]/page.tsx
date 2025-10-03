"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores";
import { Package, Download, HelpCircle, ArrowLeft, ShoppingCart, FileText } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import api, { API_BASE_URL } from "@/lib/api";
import type { OrderDetail } from "@metropolitan/shared";
import { toast } from "sonner";
import { ordersApi } from "@/services/api/orders-api";
import { useAddToCart, useClearCart } from "@/hooks/api/use-cart";
import { InvoicePreviewDialog } from "@/components/invoice/InvoicePreviewDialog";

type Order = OrderDetail & {
  items?: Array<{
    id: string;
    productId?: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    name: string;
    image: string | null;
    price: number;
    currency: string;
  }>;
  subtotal?: number;
  shippingCost?: number;
};

export default function OrderDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken } = useAuthStore();
  const clearCartMutation = useClearCart();
  const addToCart = useAddToCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoicePreviewOpen, setInvoicePreviewOpen] = useState(false);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      router.push("/auth/phone-login");
      return;
    }

    // Ödeme durumu kontrolü
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "success") {
      // Sepeti temizle (backend + local)
      console.log("🧹 Clearing cart after successful payment...");
      clearCartMutation.mutate();
      
      toast.success("Ödeme Başarılı!", {
        description: "Siparişiniz başarıyla oluşturuldu. Kısa sürede hazırlanacak.",
      });
      
      // URL'den payment parametresini kaldır
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    } else if (paymentStatus === "cancelled") {
      toast.error("Ödeme İptal Edildi", {
        description: "Ödeme işlemi iptal edildi. Tekrar deneyebilirsiniz.",
      });
      
      // URL'den payment parametresini kaldır
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }

    fetchOrderDetail();
  }, [accessToken, params.id, searchParams]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/${params.id}`);
      console.log("📦 Order data received:", response.data);

      // Backend response: { order, items, trackingEvents }
      const { order: orderData, items: rawItems } = response.data;
      
      // Transform items to match expected structure
      const transformedItems = rawItems?.map((item: any) => ({
        id: item.id,
        productId: item.product?.id || item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        name: item.product?.name || item.product?.fullName || 'Ürün',
        image: item.product?.imageUrl ? `${API_BASE_URL}${item.product.imageUrl}` : null,
        price: parseFloat(item.unitPrice) || 0,
        currency: orderData.currency || 'PLN',
      })) || [];

      console.log("🖼️ Transformed items:", transformedItems.map(i => ({ 
        name: i.name, 
        image: i.image,
        price: i.price,
        productId: i.productId
      })));

      // Calculate subtotal from items
      const subtotal = transformedItems.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);

      // Calculate shipping cost (total - subtotal)
      const totalAmount = parseFloat(orderData.totalAmount) || 0;
      const shippingCost = totalAmount - subtotal;

      setOrder({ 
        ...orderData,
        items: transformedItems,
        subtotal: subtotal,
        shippingCost: shippingCost >= 0 ? shippingCost : 0,
      });
    } catch (error) {
      console.error("Failed to fetch order:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (!order) return;
    // Open preview dialog instead of direct download
    setInvoicePreviewOpen(true);
  };

  const handleReorder = async () => {
    if (!order || !order.items) return;

    try {
      setReordering(true);

      // Add all items to cart sequentially
      for (const item of order.items) {
        await addToCart.mutateAsync({
          productId: item.product.id,
          quantity: item.quantity,
        });
      }

      toast.success("Ürünler sepete eklendi", {
        description: `${order.items.length} ürün sepetinize eklendi.`,
      });

      // Navigate to cart after a short delay
      setTimeout(() => {
        router.push("/?openCart=true");
      }, 1000);
    } catch (error) {
      console.error("Failed to reorder:", error);
      toast.error("Yeniden sipariş verilemedi", {
        description: "Ürünler sepete eklenirken bir hata oluştu.",
      });
    } finally {
      setReordering(false);
    }
  };

  const formatPrice = (price: number | string, currency = "PLN") => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(numPrice)) return `0 ${currency}`;
    
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency,
    }).format(numPrice);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      preparing: "bg-purple-100 text-purple-800",
      shipped: "bg-indigo-100 text-indigo-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return statusMap[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="h-64 bg-muted rounded-xl"></div>
            <div className="h-48 bg-muted rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">
            {t("order_detail.not_found_title")}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t("order_detail.not_found_body")}
          </p>
          <Button onClick={() => router.push("/orders")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Siparişlerime Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri
        </Button>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Sipariş #{order.orderNumber}
            </h1>
            <p className="text-muted-foreground">
              {formatDate(order.createdAt)}
            </p>
          </div>
          <Badge className={getStatusColor(order.status)}>
            {t(`status.${order.status}`)}
          </Badge>
        </div>

        {/* Order Items */}
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {t("order_detail.products.section_title")}
          </h2>
          {/* Scrollable container for items - max 5 items visible */}
          <div className="max-h-[440px] overflow-y-auto space-y-4 pr-2">
            {order.items.map((item) => (
              <Link
                href={`/product/${item.productId || item.id}`}
                key={item.id}
                className="flex gap-4 pb-4 border-b border-border last:border-b-0 last:pb-0 hover:bg-muted/50 transition-colors rounded-lg p-2 -m-2"
              >
                <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1 hover:text-primary transition-colors">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("order_detail.products.quantity", { count: item.quantity })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {formatPrice(item.price * item.quantity, item.currency)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {t("order_detail.summary.section_title")}
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t("order_detail.summary.subtotal")}
              </span>
              <span className="font-medium">
                {formatPrice(order.subtotal, order.currency)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t("order_detail.summary.shipping")}
              </span>
              <span className="font-medium text-green-600">
                {order.shippingCost === 0
                  ? t("order_detail.summary.free_shipping")
                  : formatPrice(order.shippingCost, order.currency)}
              </span>
            </div>
            <div className="border-t border-border pt-3">
              <div className="flex justify-between">
                <span className="font-semibold">
                  {t("order_detail.summary.total")}
                </span>
                <span className="font-bold text-xl text-primary">
                  {formatPrice(order.totalAmount, order.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        {order.shippingAddress && (
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {t("order_detail.delivery_payment.delivery_address")}
            </h2>
            <p className="text-muted-foreground">
              {order.shippingAddress.addressTitle && (
                <>
                  <strong>{order.shippingAddress.addressTitle}</strong>
                  <br />
                </>
              )}
              {order.shippingAddress.street}
              <br />
              {order.shippingAddress.postalCode} {order.shippingAddress.city}
              <br />
              {order.shippingAddress.country}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            variant="outline"
            onClick={handleDownloadInvoice}
          >
            <FileText className="mr-2 h-4 w-4" />
            Fatura Önizle
          </Button>
          <Button
            variant="outline"
            onClick={handleReorder}
            disabled={reordering}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {reordering ? "Ekleniyor..." : "Yeniden Sipariş Ver"}
          </Button>
          <Button variant="outline">
            <HelpCircle className="mr-2 h-4 w-4" />
            {t("order_detail.help")}
          </Button>
        </div>
      </div>

      {/* Invoice Preview Dialog */}
      {order && (
        <InvoicePreviewDialog
          open={invoicePreviewOpen}
          onOpenChange={setInvoicePreviewOpen}
          orderId={order.id}
          orderNumber={order.orderNumber}
        />
      )}
    </div>
  );
}

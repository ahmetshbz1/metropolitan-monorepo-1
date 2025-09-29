"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores";
import { Package, Download, HelpCircle, ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { api } from "@/services/api/client";
import Image from "next/image";

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  image: string | null;
  quantity: number;
  price: number;
  currency: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  subtotal: number;
  shippingCost: number;
  currency: string;
  createdAt: string;
  items: OrderItem[];
  shippingAddress: {
    fullAddress: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

export default function OrderDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      router.push("/auth/phone-login");
      return;
    }

    fetchOrderDetail();
  }, [accessToken, params.id]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/${params.id}`);
      setOrder(response.data);
    } catch (error) {
      console.error("Failed to fetch order:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency = "TRY") => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency,
    }).format(price);
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
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4 pb-4 border-b border-border last:border-b-0 last:pb-0">
                <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("order_detail.products.quantity", { count: item.quantity })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {formatPrice(item.price * item.quantity, item.currency)}
                  </p>
                </div>
              </div>
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
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {t("order_detail.delivery_payment.delivery_address")}
          </h2>
          <p className="text-muted-foreground">
            {order.shippingAddress.fullAddress}
            <br />
            {order.shippingAddress.postalCode} {order.shippingAddress.city}
            <br />
            {order.shippingAddress.country}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            {t("order_detail.actions.download_invoice")}
          </Button>
          <Button variant="outline" className="flex-1">
            <HelpCircle className="mr-2 h-4 w-4" />
            {t("order_detail.help")}
          </Button>
        </div>
      </div>
    </div>
  );
}

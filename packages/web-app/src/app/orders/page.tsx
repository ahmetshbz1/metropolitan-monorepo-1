"use client";

export const dynamic = "force-dynamic";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores";
import { Package, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { ordersApi } from "@/services/api/orders-api";
import type { Order } from "@metropolitan/shared";

export default function OrdersPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      router.push("/auth/phone-login");
      return;
    }

    fetchOrders();
  }, [accessToken, router]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersApi.getOrders();
      console.log("📦 Orders data received:", data);
      setOrders(data || []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: string | number, currency = "PLN") => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
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
    });
  };

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      preparing: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
      shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400",
      delivered: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    };
    return statusMap[status] || "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
  };

  if (!accessToken || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {t("orders.guest_empty.title")}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t("orders.guest_empty.subtitle")}
          </p>
          <Button asChild>
            <Link href="/auth/phone-login">{t("orders.guest_empty.button")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-6">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="h-6 bg-muted rounded w-32 mb-4 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-28 bg-muted rounded-lg animate-pulse"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {t("orders.empty.title")}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t("orders.empty.subtitle")}
          </p>
          <Button asChild>
            <Link href="/products">{t("orders.empty.button")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-6">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Compact Header */}
        <div className="mb-4">
          <h1 className="text-lg font-bold">{t("tabs.orders")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("orders.subtitle")}
          </p>
        </div>

        {/* Grid Layout - Responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/order/${order.id}`}
              className="group bg-card rounded-lg border p-4 hover:shadow-md hover:border-primary/30 transition-all"
            >
              {/* Header with Status */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-0.5 truncate">
                    {t("orders.order_number", { number: order.orderNumber })}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <Badge className={`${getStatusColor(order.status)} text-xs ml-2 flex-shrink-0`}>
                  {t(`status.${order.status}`)}
                </Badge>
              </div>

              {/* Price - Compact */}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-muted-foreground">
                  {t("order_detail.summary.total")}
                </span>
                <span className="font-bold text-sm text-primary">
                  {formatPrice(order.totalAmount, order.currency)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

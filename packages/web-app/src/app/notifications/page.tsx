"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores";
import { useNotifications, useDeleteNotification, useMarkAllAsRead } from "@/hooks/api/use-notifications";
import { Bell, Trash2 } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function NotificationsPage() {
  const { t } = useTranslation();
  const { user, accessToken } = useAuthStore();
  const { data: notifications = [], isLoading: loading } = useNotifications();
  const deleteNotification = useDeleteNotification();
  const markAllAsRead = useMarkAllAsRead();

  if (!accessToken || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Bell className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Bildirimlerinizi görmek için giriş yapın</h2>
          <p className="text-muted-foreground mb-6">
            Sipariş güncellemeleri ve özel tekliflerden haberdar olun.
          </p>
          <Button asChild>
            <Link href="/auth/phone-login">Giriş Yap</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="h-8 bg-muted rounded w-48 mb-6 animate-pulse"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Bell className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {t("notifications.empty_title")}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t("notifications.empty_message")}
          </p>
          <Button asChild>
            <Link href="/products">Alışverişe Başla</Link>
          </Button>
        </div>
      </div>
    );
  }

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      order: "📦",
      promotion: "🎉",
      delivery: "🚚",
      system: "ℹ️",
    };
    return icons[type] || "📢";
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">{t("notifications.title")}</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            {t("notifications.mark_all_read")}
          </Button>
        </div>

        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-card rounded-xl border border-border p-4 ${
                !notification.isRead ? "bg-primary/5" : ""
              }`}
            >
              <div className="flex gap-4">
                <div className="text-3xl">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold">{notification.title}</h3>
                    {!notification.isRead && (
                      <Badge variant="default" className="ml-2">Yeni</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(notification.createdAt).toLocaleString("tr-TR")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteNotification.mutate(notification.id)}
                  disabled={deleteNotification.isPending}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

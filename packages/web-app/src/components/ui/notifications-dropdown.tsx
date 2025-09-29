"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useDeleteNotification,
  useMarkAllAsRead,
  useMarkAsRead,
  useNotifications,
} from "@/hooks/api/use-notifications";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { useTranslation } from "react-i18next";

const NOTIFICATION_ICONS = {
  order: "solar:box-line-duotone",
  payment: "solar:wallet-line-duotone",
  system: "solar:info-circle-line-duotone",
  promotion: "solar:tag-line-duotone",
  delivery: "solar:box-line-duotone",
};

export function NotificationsDropdown() {
  const { t } = useTranslation();
  const { data: notifications = [], isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = (id: string, isRead: boolean) => {
    if (!isRead) {
      markAsRead.mutate(id);
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead.mutate();
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteNotification.mutate(id);
  };

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-accent"
            >
              <Icon
                icon="solar:bell-line-duotone"
                className="size-5 text-gray-700 dark:text-gray-300"
              />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-red-500 text-white p-0">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t("navbar.notifications")}</p>
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent
        className="w-96 max-w-[calc(100vw-2rem)] rounded-2xl p-2"
        align="end"
        alignOffset={-16}
        sideOffset={8}
        avoidCollisions={true}
        collisionPadding={16}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 mb-2">
          <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">
            {t("dropdown.notifications")}
          </h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary hover:text-primary/80"
              onClick={handleMarkAllRead}
              disabled={markAllAsRead.isPending}
            >
              Tümünü Okundu İşaretle
            </Button>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Notifications List */}
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Icon
                icon="svg-spinners:ring-resize"
                className="size-8 text-primary"
              />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4">
              <Icon
                icon="solar:bell-off-line-duotone"
                className="size-12 text-gray-300 dark:text-gray-600 mb-3"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Henüz bildiriminiz yok
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "group relative p-3 rounded-lg cursor-pointer transition-colors flex-col items-start gap-1",
                    !notification.isRead && "bg-primary/5"
                  )}
                  onClick={() =>
                    handleNotificationClick(
                      notification.id,
                      notification.isRead
                    )
                  }
                >
                  <div className="flex items-start gap-3 w-full">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
                        notification.type === "order" &&
                          "bg-blue-100 dark:bg-blue-900/30",
                        notification.type === "payment" &&
                          "bg-green-100 dark:bg-green-900/30",
                        notification.type === "system" &&
                          "bg-gray-100 dark:bg-gray-800",
                        notification.type === "promotion" &&
                          "bg-orange-100 dark:bg-orange-900/30",
                        notification.type === "delivery" &&
                          "bg-blue-100 dark:bg-blue-900/30"
                      )}
                    >
                      <Icon
                        icon={NOTIFICATION_ICONS[notification.type]}
                        className={cn(
                          "size-5",
                          notification.type === "order" &&
                            "text-blue-600 dark:text-blue-400",
                          notification.type === "payment" &&
                            "text-green-600 dark:text-green-400",
                          notification.type === "system" &&
                            "text-gray-600 dark:text-gray-400",
                          notification.type === "promotion" &&
                            "text-orange-600 dark:text-orange-400",
                          notification.type === "delivery" &&
                            "text-blue-600 dark:text-blue-400"
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {notification.body}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: tr,
                        })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDelete(e, notification.id)}
                    >
                      <Icon
                        icon="solar:close-circle-line-duotone"
                        className="size-4 text-gray-400 hover:text-red-500"
                      />
                    </Button>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

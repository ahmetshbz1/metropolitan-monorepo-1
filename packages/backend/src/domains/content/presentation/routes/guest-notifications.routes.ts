//  "guest-notifications.routes.ts"
//  metropolitan backend
//  Guest kullanıcılar için bildirim sistemi

import { t } from "elysia";

import { logger } from "../../../../shared/infrastructure/monitoring/logger.config";
import { createApp } from "../../../../shared/infrastructure/web/app";

export const guestNotificationsRoutes = createApp()
  // Guest kullanıcıların bildirimlerini getir
  // Şu an için boş array dönüyoruz, ileride sistem bildirimleri eklenecek
  .get(
    "/notifications/:guestId",
    async ({ params, query }) => {
      const { guestId } = params;

      if (!guestId) {
        return { success: false, notifications: [], unreadCount: 0 };
      }

      const { page = 1, limit = 20 } = query;

      try {
        // Future feature: Sistem bildirimleri, kampanyalar, yeni ürünler, indirimler eklenebilir

        return {
          success: true,
          notifications: [],
          unreadCount: 0,
          page: Number(page),
          limit: Number(limit),
        };
      } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error), guestId }, "Guest notifications fetch error");
        return { success: false, notifications: [], unreadCount: 0 };
      }
    },
    {
      params: t.Object({
        guestId: t.String(),
      }),
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    }
  );

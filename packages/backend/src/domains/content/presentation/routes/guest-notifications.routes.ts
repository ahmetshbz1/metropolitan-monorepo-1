//  "guest-notifications.routes.ts"
//  metropolitan backend
//  Guest kullanıcılar için bildirim sistemi

import { t } from "elysia";
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
        // TODO: İleride burada sistem bildirimleri, kampanyalar vs. gösterilebilir
        // Örneğin: Yeni ürünler, indirimler, özel teklifler

        return {
          success: true,
          notifications: [],
          unreadCount: 0,
          page: Number(page),
          limit: Number(limit),
        };
      } catch (error) {
        console.error("Guest notifications fetch error:", error);
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

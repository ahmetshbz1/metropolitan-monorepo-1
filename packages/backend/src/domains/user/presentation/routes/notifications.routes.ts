//  "notifications.routes.ts"
//  metropolitan backend
//  Created by Ahmet on 26.09.2025.

import { t } from "elysia";
import { and, eq, desc, sql, isNull } from "drizzle-orm";

import { isAuthenticated } from "../../../../shared/application/guards/auth.guard";
import { createApp } from "../../../../shared/infrastructure/web/app";
import { db } from "../../../../shared/infrastructure/database/connection";
import { notifications } from "../../../../shared/infrastructure/database/schema";

export const notificationsRoutes = createApp()
  .use(isAuthenticated)

  // Kullanıcının bildirimlerini getir
  .get(
    "/notifications",
    async ({ profile, query }) => {
      const userId = profile?.sub || profile?.userId;
      if (!userId) {
        return { success: false, notifications: [], unreadCount: 0 };
      }

      const { page = 1, limit = 20, unread } = query;
      const offset = (Number(page) - 1) * Number(limit);

      try {
        // Okunmamış bildirim sayısı
        const unreadCountResult = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(notifications)
          .where(
            and(
              eq(notifications.userId, userId),
              eq(notifications.isRead, false)
            )
          );

        const unreadCount = unreadCountResult[0]?.count || 0;

        // Bildirimleri getir
        const whereConditions = [eq(notifications.userId, userId)];

        if (unread === "true") {
          whereConditions.push(eq(notifications.isRead, false));
        }

        const userNotifications = await db
          .select()
          .from(notifications)
          .where(and(...whereConditions))
          .orderBy(desc(notifications.createdAt))
          .limit(Number(limit))
          .offset(offset);

        return {
          success: true,
          notifications: userNotifications,
          unreadCount,
          page: Number(page),
          limit: Number(limit),
        };
      } catch (error) {
        console.error("Notifications fetch error:", error);
        return { success: false, notifications: [], unreadCount: 0 };
      }
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        unread: t.Optional(t.String()),
      }),
    }
  )

  // Bildirimi okundu olarak işaretle
  .put(
    "/notifications/:id/read",
    async ({ profile, params, set }) => {
      const userId = profile?.sub || profile?.userId;
      if (!userId) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
      }

      try {
        const result = await db
          .update(notifications)
          .set({
            isRead: true,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(notifications.id, params.id),
              eq(notifications.userId, userId)
            )
          )
          .returning();

        if (result.length === 0) {
          set.status = 404;
          return { success: false, message: "Notification not found" };
        }

        return { success: true };
      } catch (error) {
        console.error("Mark as read error:", error);
        set.status = 500;
        return { success: false, message: "Failed to update notification" };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )

  // Tüm bildirimleri okundu olarak işaretle
  .put(
    "/notifications/mark-all-read",
    async ({ profile, set }) => {
      const userId = profile?.sub || profile?.userId;
      if (!userId) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
      }

      try {
        await db
          .update(notifications)
          .set({
            isRead: true,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(notifications.userId, userId),
              eq(notifications.isRead, false)
            )
          );

        return { success: true };
      } catch (error) {
        console.error("Mark all as read error:", error);
        set.status = 500;
        return { success: false, message: "Failed to update notifications" };
      }
    }
  )

  // Bildirimi sil
  .delete(
    "/notifications/:id",
    async ({ profile, params, set }) => {
      const userId = profile?.sub || profile?.userId;
      if (!userId) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
      }

      try {
        const result = await db
          .delete(notifications)
          .where(
            and(
              eq(notifications.id, params.id),
              eq(notifications.userId, userId)
            )
          )
          .returning();

        if (result.length === 0) {
          set.status = 404;
          return { success: false, message: "Notification not found" };
        }

        return { success: true };
      } catch (error) {
        console.error("Delete notification error:", error);
        set.status = 500;
        return { success: false, message: "Failed to delete notification" };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )

  // Tüm bildirimleri sil
  .delete(
    "/notifications",
    async ({ profile, set }) => {
      const userId = profile?.sub || profile?.userId;
      if (!userId) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
      }

      try {
        await db
          .delete(notifications)
          .where(eq(notifications.userId, userId));

        return { success: true };
      } catch (error) {
        console.error("Delete all notifications error:", error);
        set.status = 500;
        return { success: false, message: "Failed to delete notifications" };
      }
    }
  );

// Internal API - Backend tarafından bildirim eklemek için
export const createNotification = async (
  userId: string,
  notification: {
    title: string;
    body: string;
    type?: string;
    data?: any;
    source?: string;
    pushId?: string;
  }
) => {
  try {
    const [created] = await db.insert(notifications).values({
      userId,
      title: notification.title,
      body: notification.body,
      type: notification.type || "system",
      data: notification.data || {},
      source: notification.source || "push",
      pushId: notification.pushId,
    }).returning();

    return created;
  } catch (error) {
    console.error("Create notification error:", error);
    return null;
  }
};
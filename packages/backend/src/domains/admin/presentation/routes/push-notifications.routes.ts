import { t } from "elysia";

import { PushNotificationService } from "../../../../shared/application/services/push-notification.service";
import { TranslateNotificationService } from "../../application/use-cases/translate-notification.service";
import { logger } from "../../../../shared/infrastructure/monitoring/logger.config";

import { createAdminRouter } from "./admin-router.factory";

type Language = "tr" | "en" | "pl";

const pushNotificationSchema = t.Object({
  title: t.Optional(t.String()),
  body: t.Optional(t.String()),
  customTranslations: t.Optional(
    t.Record(
      t.Union([t.Literal("tr"), t.Literal("en"), t.Literal("pl")]),
      t.Object({
        title: t.String(),
        body: t.String(),
      })
    )
  ),
  type: t.Optional(t.String()),
  data: t.Optional(t.Record(t.String(), t.Unknown())),
  badge: t.Optional(t.Number()),
});

const batchPushSchema = t.Object({
  userIds: t.Array(t.String({ format: "uuid" })),
  title: t.Optional(t.String()),
  body: t.Optional(t.String()),
  customTranslations: t.Optional(
    t.Record(
      t.Union([t.Literal("tr"), t.Literal("en"), t.Literal("pl")]),
      t.Object({
        title: t.String(),
        body: t.String(),
      })
    )
  ),
  type: t.Optional(t.String()),
  data: t.Optional(t.Record(t.String(), t.Unknown())),
  badge: t.Optional(t.Number()),
});

export const adminPushNotificationsRoutes = createAdminRouter("/admin/push")
  // Tek kullanıcıya push gönder
  .post(
    "/users/:userId",
    async ({ params, body, set }) => {
      try {
        const success = await PushNotificationService.sendToUser(
          params.userId,
          {
            title: body.title,
            body: body.body,
            customTranslations: body.customTranslations as Record<
              Language,
              { title: string; body: string }
            >,
            type: body.type || "admin",
            data: body.data || {},
            badge: body.badge,
          }
        );

        if (success) {
          return {
            success: true,
            message: "Push bildirimi başarıyla gönderildi",
          };
        } else {
          set.status = 400;
          return {
            success: false,
            message: "Kullanıcıya ait aktif cihaz bulunamadı",
          };
        }
      } catch (error) {
        logger.error({ error, context: "AdminPushNotificationsRoutes" }, "Push notification error");
        set.status = 500;
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Push bildirimi gönderilemedi",
        };
      }
    },
    {
      params: t.Object({ userId: t.String({ format: "uuid" }) }),
      body: pushNotificationSchema,
    }
  )
  // Birden fazla kullanıcıya push gönder
  .post(
    "/batch",
    async ({ body, set }) => {
      try {
        const result = await PushNotificationService.sendToMultipleUsers(
          body.userIds,
          {
            title: body.title,
            body: body.body,
            customTranslations: body.customTranslations as Record<
              Language,
              { title: string; body: string }
            >,
            type: body.type || "admin",
            data: body.data || {},
            badge: body.badge,
          }
        );

        return {
          success: true,
          message: `Push bildirimi gönderildi: ${result.sent} başarılı, ${result.failed} başarısız`,
          data: result,
        };
      } catch (error) {
        logger.error({ error, context: "AdminPushNotificationsRoutes" }, "Batch push notification error");
        set.status = 500;
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Toplu push bildirimi gönderilemedi",
        };
      }
    },
    {
      body: batchPushSchema,
    }
  )
  // Tüm kullanıcılara broadcast push gönder
  .post(
    "/broadcast",
    async ({ body, set }) => {
      try {
        const result = await PushNotificationService.broadcast({
          title: body.title,
          body: body.body,
          customTranslations: body.customTranslations as Record<
            Language,
            { title: string; body: string }
          >,
          type: body.type || "admin",
          data: body.data || {},
          badge: body.badge,
        });

        return {
          success: true,
          message: `Broadcast tamamlandı: ${result.sent} başarılı, ${result.failed} başarısız`,
          data: result,
        };
      } catch (error) {
        logger.error({ error, context: "AdminPushNotificationsRoutes" }, "Broadcast push notification error");
        set.status = 500;
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Broadcast push gönderilemedi",
        };
      }
    },
    {
      body: pushNotificationSchema,
    }
  )
  // Çeviri yap
  .post(
    "/translate",
    async ({ body, set }) => {
      try {
        const result = await TranslateNotificationService.translateBoth(
          body.text
        );

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        logger.error({ error, context: "AdminPushNotificationsRoutes" }, "Translation error");
        set.status = 500;
        return {
          success: false,
          message:
            error instanceof Error ? error.message : "Çeviri başarısız",
        };
      }
    },
    {
      body: t.Object({
        text: t.String(),
      }),
    }
  );

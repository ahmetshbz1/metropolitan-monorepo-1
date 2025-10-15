// change-phone-current.routes.ts
// Validates current phone number and creates phone change request session

import { randomBytes } from "crypto";

import { logger } from "@bogeychan/elysia-logger";
import { eq } from "drizzle-orm";

import {
  phoneChangeRequests,
  users,
} from "../../../../shared/infrastructure/database/schema";
import { createApp } from "../../../../shared/infrastructure/web/app";

import { authTokenGuard } from "./auth-guards";
import {
  verifyCurrentPhoneSchema,
  type VerifyCurrentPhoneResponse,
} from "./change-phone-types";

export const changePhoneCurrentRoutes = createApp()
  .use(logger({ level: "info" }))
  .use(authTokenGuard)
  .post(
    "/verify-current",
    async ({ body, profile, db, log, set }): Promise<VerifyCurrentPhoneResponse> => {
      try {
        // Extract userId from JWT structure
        const userId = profile?.sub || profile?.userId;
        if (!profile || !userId) {
          set.status = 401;
          return {
            success: false,
            message: "Yetkilendirme gerekli",
          };
        }

        const { currentPhone } = body;

        // Kullanıcıyı bul
        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (!user.length) {
          set.status = 404;
          return {
            success: false,
            message: "Kullanıcı bulunamadı",
          };
        }

        // Telefon numarası eşleşiyor mu?
        if (user[0].phoneNumber !== currentPhone) {
          set.status = 400;
          return {
            success: false,
            message: "Telefon numarası eşleşmiyor",
          };
        }

        // Session ID oluştur
        const sessionId = randomBytes(16).toString("hex");

        // Değişiklik talebini veritabanına kaydet
        await db.insert(phoneChangeRequests).values({
          userId: userId,
          currentPhone,
          sessionId,
          step: "current_verified",
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 dakika
        });

        log.info(
          { userId: userId },
          "Phone change request initiated"
        );

        return {
          success: true,
          sessionId,
          message: "Mevcut telefon numarası doğrulandı",
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        log.error({ error: errorMessage }, "Verify current phone error");
        set.status = 500;
        return {
          success: false,
          message: "Telefon doğrulama hatası",
        };
      }
    },
    {
      body: verifyCurrentPhoneSchema,
    }
  );

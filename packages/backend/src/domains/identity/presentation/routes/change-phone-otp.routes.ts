// change-phone-otp.routes.ts
// Handles OTP sending and resending for phone change process

import { randomBytes } from "crypto";

import { logger } from "@bogeychan/elysia-logger";
import { and, eq } from "drizzle-orm";

import {
  phoneChangeRequests,
  users,
} from "../../../../shared/infrastructure/database/schema";
import { createApp } from "../../../../shared/infrastructure/web/app";
import { createChangePhoneOtp } from "../../application/use-cases/otp.service";
import { getLanguageFromHeader } from "../../infrastructure/templates/sms-templates";

import { authTokenGuard } from "./auth-guards";
import {
  resendOtpSchema,
  sendOtpSchema,
  type ResendOtpResponse,
  type SendOtpResponse,
} from "./change-phone-types";

export const changePhoneOtpRoutes = createApp()
  .use(logger({ level: "info" }))
  .use(authTokenGuard)
  // Yeni telefon numarasına OTP gönder
  .post(
    "/send-otp",
    async ({
      body,
      profile,
      headers,
      db,
      log,
      set,
    }): Promise<SendOtpResponse> => {
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

        const { sessionId, newPhone } = body;

        // Session'ı kontrol et
        const request = await db
          .select()
          .from(phoneChangeRequests)
          .where(
            and(
              eq(phoneChangeRequests.sessionId, sessionId),
              eq(phoneChangeRequests.userId, userId),
              eq(phoneChangeRequests.step, "current_verified")
            )
          )
          .limit(1);

        if (!request.length) {
          set.status = 400;
          return {
            success: false,
            message: "Geçersiz veya süresi dolmuş oturum",
          };
        }

        // Yeni numara zaten kullanılıyor mu?
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.phoneNumber, newPhone))
          .limit(1);

        if (existingUser.length) {
          set.status = 400;
          return {
            success: false,
            message: "Bu telefon numarası zaten kullanımda",
          };
        }

        // Get user's preferred language from Accept-Language header
        const language = getLanguageFromHeader(headers["accept-language"]);

        // OTP gönder (change_phone action)
        await createChangePhoneOtp(newPhone, language);

        // Yeni session ID oluştur
        const newSessionId = randomBytes(16).toString("hex");

        // Güncelle
        await db
          .update(phoneChangeRequests)
          .set({
            newPhone,
            newSessionId,
            step: "otp_sent",
            updatedAt: new Date(),
          })
          .where(eq(phoneChangeRequests.sessionId, sessionId));

        log.info({ userId: userId, newPhone }, "Change phone OTP sent");

        return {
          success: true,
          sessionId: newSessionId,
          message: "Doğrulama kodu gönderildi",
        };
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        log.error({ error: errorMessage }, "Send OTP error");
        set.status = 500;
        return {
          success: false,
          message: "SMS gönderilemedi",
        };
      }
    },
    {
      body: sendOtpSchema,
    }
  )
  // OTP'yi yeniden gönder
  .post(
    "/resend-otp",
    async ({
      body,
      profile,
      headers,
      db,
      log,
      set,
    }): Promise<ResendOtpResponse> => {
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

        const { sessionId, phone } = body;

        // Request'i bul
        const request = await db
          .select()
          .from(phoneChangeRequests)
          .where(
            and(
              eq(phoneChangeRequests.newSessionId, sessionId),
              eq(phoneChangeRequests.userId, userId),
              eq(phoneChangeRequests.step, "otp_sent")
            )
          )
          .limit(1);

        if (!request.length) {
          set.status = 400;
          return {
            success: false,
            message: "Geçersiz oturum",
          };
        }

        // Get user's preferred language from Accept-Language header
        const language = getLanguageFromHeader(headers["accept-language"]);

        // Yeni OTP gönder (change_phone action)
        await createChangePhoneOtp(phone, language);

        // Son güncelleme zamanını kaydet
        await db
          .update(phoneChangeRequests)
          .set({
            updatedAt: new Date(),
          })
          .where(eq(phoneChangeRequests.id, request[0].id));

        log.info({ userId: userId, phone }, "Phone change OTP resent");

        return {
          success: true,
          message: "Yeni doğrulama kodu gönderildi",
        };
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        log.error({ error: errorMessage }, "Resend OTP error");
        set.status = 500;
        return {
          success: false,
          message: "SMS gönderilemedi",
        };
      }
    },
    {
      body: resendOtpSchema,
    }
  );

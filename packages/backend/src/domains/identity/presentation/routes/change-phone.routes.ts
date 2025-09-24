// change-phone.routes.ts
// Phone number change endpoints with multi-step verification

import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { eq, and } from "drizzle-orm";
import { db } from "../../../../shared/infrastructure/database/connection";
import { users, phoneChangeRequests } from "../../../../shared/infrastructure/database/schema";
import { createOtp, verifyOtp } from "../../application/use-cases/otp.service";
import { randomBytes } from "crypto";
import { isTokenBlacklisted } from "../../../../shared/infrastructure/database/redis";

export const changePhoneRoutes = new Elysia({ prefix: "/auth/change-phone" })
  .use(jwt({ name: "jwt", secret: process.env.JWT_SECRET! }))
  // Mevcut telefon numarasını doğrula
  .post(
    "/verify-current",
    async ({ body, headers, jwt }) => {
      try {
        // JWT token'ı doğrula
        const token = headers.authorization?.replace("Bearer ", "");
        if (!token) {
          return {
            success: false,
            message: "Yetkilendirme gerekli",
            statusCode: 401
          };
        }

        const isBlacklisted = await isTokenBlacklisted(token);
        if (isBlacklisted) {
          return {
            success: false,
            message: "Token geçersiz",
            statusCode: 401
          };
        }

        const decoded = await jwt.verify(token) as { userId: string } | false;
        if (!decoded || !decoded.userId) {
          return {
            success: false,
            message: "Geçersiz token",
            statusCode: 401
          };
        }

        const { currentPhone } = body;

        // Kullanıcıyı bul
        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, decoded.userId))
          .limit(1);

        if (!user.length) {
          return {
            success: false,
            message: "Kullanıcı bulunamadı",
            statusCode: 404
          };
        }

        // Telefon numarası eşleşiyor mu?
        if (user[0].phoneNumber !== currentPhone) {
          return {
            success: false,
            message: "Telefon numarası eşleşmiyor",
            statusCode: 400
          };
        }

        // Session ID oluştur
        const sessionId = randomBytes(16).toString("hex");

        // Değişiklik talebini veritabanına kaydet
        await db.insert(phoneChangeRequests).values({
          userId: decoded.userId,
          currentPhone,
          sessionId,
          step: "current_verified",
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 dakika
        });

        return {
          success: true,
          sessionId,
          message: "Mevcut telefon numarası doğrulandı"
        };
      } catch (error: any) {
        console.error("Verify current phone error:", error);
        return {
          success: false,
          message: "Telefon doğrulama hatası",
          statusCode: 500
        };
      }
    },
    {
      body: t.Object({
        currentPhone: t.String(),
      }),
    }
  )

  // Yeni telefon numarasına OTP gönder
  .post(
    "/send-otp",
    async ({ body, headers, jwt }) => {
      try {
        const token = headers.authorization?.replace("Bearer ", "");
        if (!token) {
          return {
            success: false,
            message: "Yetkilendirme gerekli",
            statusCode: 401
          };
        }

        const isBlacklisted = await isTokenBlacklisted(token);
        if (isBlacklisted) {
          return {
            success: false,
            message: "Token geçersiz",
            statusCode: 401
          };
        }

        const decoded = await jwt.verify(token) as { userId: string } | false;
        if (!decoded || !decoded.userId) {
          return {
            success: false,
            message: "Geçersiz token",
            statusCode: 401
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
              eq(phoneChangeRequests.userId, decoded.userId),
              eq(phoneChangeRequests.step, "current_verified")
            )
          )
          .limit(1);

        if (!request.length) {
          return {
            success: false,
            message: "Geçersiz veya süresi dolmuş oturum",
            statusCode: 400
          };
        }

        // Yeni numara zaten kullanılıyor mu?
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.phoneNumber, newPhone))
          .limit(1);

        if (existingUser.length) {
          return {
            success: false,
            message: "Bu telefon numarası zaten kullanımda",
            statusCode: 400
          };
        }

        // OTP gönder (Twilio Verify kullanıyor)
        await createOtp(newPhone);

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

        return {
          success: true,
          sessionId: newSessionId,
          message: "Doğrulama kodu gönderildi"
        };
      } catch (error: any) {
        console.error("Send OTP error:", error);
        return {
          success: false,
          message: "SMS gönderilemedi",
          statusCode: 500
        };
      }
    },
    {
      body: t.Object({
        sessionId: t.String(),
        newPhone: t.String(),
      }),
    }
  )

  // Yeni telefon numarasını doğrula ve değişikliği tamamla
  .post(
    "/verify-new",
    async ({ body, headers, jwt }) => {
      try {
        const token = headers.authorization?.replace("Bearer ", "");
        if (!token) {
          return {
            success: false,
            message: "Yetkilendirme gerekli",
            statusCode: 401
          };
        }

        const isBlacklisted = await isTokenBlacklisted(token);
        if (isBlacklisted) {
          return {
            success: false,
            message: "Token geçersiz",
            statusCode: 401
          };
        }

        const decoded = await jwt.verify(token) as { userId: string } | false;
        if (!decoded || !decoded.userId) {
          return {
            success: false,
            message: "Geçersiz token",
            statusCode: 401
          };
        }

        const { currentSessionId, newSessionId, otp } = body;

        // Request'i bul
        const request = await db
          .select()
          .from(phoneChangeRequests)
          .where(
            and(
              eq(phoneChangeRequests.sessionId, currentSessionId),
              eq(phoneChangeRequests.newSessionId, newSessionId),
              eq(phoneChangeRequests.userId, decoded.userId),
              eq(phoneChangeRequests.step, "otp_sent")
            )
          )
          .limit(1);

        if (!request.length) {
          return {
            success: false,
            message: "Geçersiz veya süresi dolmuş oturum",
            statusCode: 400
          };
        }

        // OTP'yi doğrula (Twilio Verify kullanıyor)
        const isValid = await verifyOtp(request[0].newPhone, otp);
        if (!isValid) {
          return {
            success: false,
            message: "Geçersiz doğrulama kodu",
            statusCode: 400
          };
        }

        // Telefon numarasını güncelle
        await db
          .update(users)
          .set({
            phoneNumber: request[0].newPhone,
            phoneNumberVerified: true,
            phoneNumberChangedAt: new Date(),
            previousPhoneNumber: request[0].currentPhone,
            updatedAt: new Date(),
          })
          .where(eq(users.id, decoded.userId));

        // Request'i tamamlandı olarak işaretle
        await db
          .update(phoneChangeRequests)
          .set({
            step: "completed",
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(phoneChangeRequests.id, request[0].id));

        return {
          success: true,
          message: "Telefon numaranız başarıyla değiştirildi"
        };
      } catch (error: any) {
        console.error("Verify new phone error:", error);
        return {
          success: false,
          message: "Doğrulama hatası",
          statusCode: 500
        };
      }
    },
    {
      body: t.Object({
        currentSessionId: t.String(),
        newSessionId: t.String(),
        otp: t.String(),
      }),
    }
  )

  // OTP'yi yeniden gönder
  .post(
    "/resend-otp",
    async ({ body, headers, jwt }) => {
      try {
        const token = headers.authorization?.replace("Bearer ", "");
        if (!token) {
          return {
            success: false,
            message: "Yetkilendirme gerekli",
            statusCode: 401
          };
        }

        const isBlacklisted = await isTokenBlacklisted(token);
        if (isBlacklisted) {
          return {
            success: false,
            message: "Token geçersiz",
            statusCode: 401
          };
        }

        const decoded = await jwt.verify(token) as { userId: string } | false;
        if (!decoded || !decoded.userId) {
          return {
            success: false,
            message: "Geçersiz token",
            statusCode: 401
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
              eq(phoneChangeRequests.userId, decoded.userId),
              eq(phoneChangeRequests.step, "otp_sent")
            )
          )
          .limit(1);

        if (!request.length) {
          return {
            success: false,
            message: "Geçersiz oturum",
            statusCode: 400
          };
        }

        // Yeni OTP gönder (Twilio Verify kullanıyor)
        await createOtp(phone);

        // Son güncelleme zamanını kaydet
        await db
          .update(phoneChangeRequests)
          .set({
            updatedAt: new Date(),
          })
          .where(eq(phoneChangeRequests.id, request[0].id));

        return {
          success: true,
          message: "Yeni doğrulama kodu gönderildi"
        };
      } catch (error: any) {
        console.error("Resend OTP error:", error);
        return {
          success: false,
          message: "SMS gönderilemedi",
          statusCode: 500
        };
      }
    },
    {
      body: t.Object({
        sessionId: t.String(),
        phone: t.String(),
      }),
    }
  );
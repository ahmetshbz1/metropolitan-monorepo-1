// change-phone.routes.ts
// Phone number change endpoints with multi-step verification

import { randomBytes } from "crypto";

import { logger } from "@bogeychan/elysia-logger";
import { and, eq } from "drizzle-orm";
import { t } from "elysia";

import {
  phoneChangeRequests,
  users,
} from "../../../../shared/infrastructure/database/schema";
import { createApp } from "../../../../shared/infrastructure/web/app";
import {
  createChangePhoneOtp,
  verifyChangePhoneOtp,
} from "../../application/use-cases/otp.service";
import {
  invalidateAllUserSessions,
  removeAllUserRefreshTokens,
  generateDeviceFingerprint,
  extractDeviceInfo,
  generateSessionId,
  generateJTI,
  storeDeviceSession,
  storeRefreshToken,
} from "../../infrastructure/security/device-fingerprint";
import { redis } from "../../../../shared/infrastructure/database/redis";
import { getLanguageFromHeader } from "../../infrastructure/templates/sms-templates";

import { authTokenGuard } from "./auth-guards";

export const changePhoneRoutes = createApp()
  .use(logger({ level: "info" }))
  .use(authTokenGuard)
  .group("/auth/change-phone", (app) =>
    app
      // Mevcut telefon numarasını doğrula
      .post(
        "/verify-current",
        async ({ body, profile, db, log, set }) => {
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
          } catch (error: any) {
            log.error({ error: error.message }, "Verify current phone error");
            set.status = 500;
            return {
              success: false,
              message: "Telefon doğrulama hatası",
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
        async ({ body, profile, headers, db, log, set }) => {
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

            log.info(
              { userId: userId, newPhone },
              "Change phone OTP sent"
            );

            return {
              success: true,
              sessionId: newSessionId,
              message: "Doğrulama kodu gönderildi",
            };
          } catch (error: any) {
            log.error({ error: error.message }, "Send OTP error");
            set.status = 500;
            return {
              success: false,
              message: "SMS gönderilemedi",
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
        async ({ body, profile, db, log, set, jwt, headers }) => {
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

            const { currentSessionId, newSessionId, otp } = body;

            // Request'i bul
            const request = await db
              .select()
              .from(phoneChangeRequests)
              .where(
                and(
                  eq(phoneChangeRequests.sessionId, currentSessionId),
                  eq(phoneChangeRequests.newSessionId, newSessionId),
                  eq(phoneChangeRequests.userId, userId),
                  eq(phoneChangeRequests.step, "otp_sent")
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

            // OTP'yi doğrula (change_phone action)
            const isValid = await verifyChangePhoneOtp(
              request[0].newPhone,
              otp
            );
            if (!isValid) {
              set.status = 400;
              return {
                success: false,
                message: "Geçersiz doğrulama kodu",
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
              .where(eq(users.id, userId));

            // Request'i tamamlandı olarak işaretle
            await db
              .update(phoneChangeRequests)
              .set({
                step: "completed",
                completedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(phoneChangeRequests.id, request[0].id));

            // Kullanıcının userType'ını çek
            const updatedUser = await db.query.users.findFirst({
              where: eq(users.id, userId),
              columns: { userType: true },
            });

            const userType = updatedUser?.userType || "individual";

            // Önce yeni session oluştur
            const deviceInfo = extractDeviceInfo(headers);
            // IMPORTANT: Telefon değişiminde aynı device'ı koruyoruz
            const deviceId = profile.deviceId || generateDeviceFingerprint(deviceInfo, headers);
            const sessionId = generateSessionId();
            const ipAddress = headers["x-forwarded-for"] || headers["x-real-ip"];

            // Yeni JWT token'lar oluştur
            const accessJTI = generateJTI();
            const refreshJTI = generateJTI();

            // Access token (15 dakika)
            const accessToken = await jwt.sign({
              sub: userId,
              type: "access",
              userType,
              sessionId,
              deviceId,
              jti: accessJTI,
              aud: "mobile-app",
              iss: "metropolitan-api",
              exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 saat (önceden 15 dakika)
            });

            // Refresh token (30 gün)
            const refreshToken = await jwt.sign({
              sub: userId,
              type: "refresh",
              userType,
              sessionId,
              deviceId,
              jti: refreshJTI,
              aud: "mobile-app",
              iss: "metropolitan-api",
              exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 gün
            });

            // Yeni session ve refresh token'ları Redis'e kaydet
            await storeDeviceSession(
              userId,
              deviceId,
              sessionId,
              deviceInfo,
              ipAddress
            );
            await storeRefreshToken(
              userId,
              refreshToken,
              deviceId,
              sessionId,
              refreshJTI
            );

            // SON OLARAK: Eski session'ları temizle (yeni session hariç)
            try {
              // Tüm eski session'ları bul ve sil
              const keysToDelete: string[] = [];

              // Device sessions
              const devicePattern = `device_session:${userId}:*`;
              const deviceKeys = await redis.keys(devicePattern);

              // Yeni device session'ı hariç tut
              const newDeviceKey = `device_session:${userId}:${deviceId}`;
              for (const key of deviceKeys as string[]) {
                if (key !== newDeviceKey) {
                  keysToDelete.push(key);
                }
              }

              // Refresh tokens
              const refreshPattern = `refresh_token:${userId}:*`;
              const refreshKeys = await redis.keys(refreshPattern);

              // Yeni refresh token'ı hariç tut
              const newRefreshKey = `refresh_token:${userId}:${refreshJTI}`;
              for (const key of refreshKeys as string[]) {
                if (key !== newRefreshKey) {
                  keysToDelete.push(key);
                }
              }

              // Session lookups
              const sessionPattern = `session:*`;
              const allSessionKeys = await redis.keys(sessionPattern);

              for (const sessionKey of allSessionKeys as string[]) {
                if (sessionKey !== `session:${sessionId}`) {
                  try {
                    const sessionData = await redis.get(sessionKey);
                    if (sessionData) {
                      const data = JSON.parse(sessionData as string);
                      if (data.userId === userId) {
                        keysToDelete.push(sessionKey);
                      }
                    }
                  } catch {
                    // Skip corrupted sessions
                  }
                }
              }

              // Delete old keys
              if (keysToDelete.length > 0) {
                await redis.del(...keysToDelete);
                log.info(
                  { userId: userId, deletedCount: keysToDelete.length },
                  "Old sessions cleared after phone change"
                );
              }
            } catch (error) {
              log.error({ error }, "Failed to clean old sessions");
              // Don't fail the operation
            }

            log.info(
              {
                userId: userId,
                newPhone: request[0].newPhone,
                deviceId,
                sessionId
              },
              "Phone number changed and automatic re-login successful"
            );

            return {
              success: true,
              message: "Telefon numaranız başarıyla değiştirildi.",
              accessToken,
              refreshToken,
              expiresIn: 900, // 15 dakika
            };
          } catch (error: any) {
            log.error({ error: error.message }, "Verify new phone error");
            set.status = 500;
            return {
              success: false,
              message: "Doğrulama hatası",
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
        async ({ body, profile, headers, db, log, set }) => {
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

            log.info(
              { userId: userId, phone },
              "Phone change OTP resent"
            );

            return {
              success: true,
              message: "Yeni doğrulama kodu gönderildi",
            };
          } catch (error: any) {
            log.error({ error: error.message }, "Resend OTP error");
            set.status = 500;
            return {
              success: false,
              message: "SMS gönderilemedi",
            };
          }
        },
        {
          body: t.Object({
            sessionId: t.String(),
            phone: t.String(),
          }),
        }
      )
  );

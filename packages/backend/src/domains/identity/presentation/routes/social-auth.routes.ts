//  "social-auth.routes.ts"
//  metropolitan backend
//  Social authentication routes (Apple, Google via Firebase)

import { logger } from "@bogeychan/elysia-logger";
import { and, eq } from "drizzle-orm";
import { t } from "elysia";

import { users } from "../../../../shared/infrastructure/database/schema";
import { createApp } from "../../../../shared/infrastructure/web/app";
import {
  extractDeviceInfo,
  generateDeviceFingerprint,
  generateJTI,
  generateSessionId,
  storeDeviceSession,
  storeRefreshToken,
} from "../../infrastructure/security/device-fingerprint";

export const socialAuthRoutes = createApp()
  .use(logger({ level: "info" }))
  .group("/auth", (app) =>
    app.post(
      "/social-signin",
      async ({ body, headers, jwt, log, db, error }) => {
        log.info(
          {
            firebaseUid: body.firebaseUid,
            email: body.email,
            provider: body.provider,
            appleUserId: body.appleUserId,
          },
          `Social auth attempt`
        );

        // If Authorization header present, treat as LINK operation to the current authenticated user
        // This prevents downgrading an already-logged-in user to guest during provider linking
        let currentUserId: string | undefined;
        try {
          const authHeader = (headers["authorization"] || headers["Authorization"]) as string | undefined;
          if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.slice(7);
            const decoded: any = await jwt.verify(token);
            if (decoded?.sub && decoded?.type === "access") {
              currentUserId = decoded.sub as string;
            }
          }
        } catch (e) {
          // Ignore token errors; proceed as sign-in
        }

        // Check user based on context
        let user;
        if (currentUserId) {
          // Linking flow: fetch the currently authenticated user
          user = await db.query.users.findFirst({ where: eq(users.id, currentUserId) });
          if (!user) {
            return error(401, "Invalid session for social linking");
          }

          // Prevent linking if another account already uses the same social identifiers
          if (body.provider === 'apple' && body.appleUserId) {
            const conflict = await db.query.users.findFirst({ where: and(eq(users.appleUserId, body.appleUserId), eq(users.userType, user.userType)) });
            if (conflict && conflict.id !== user.id) {
              return {
                success: false,
                error: "PROVIDER_CONFLICT",
                message: "This Apple account is already linked to another user.",
              };
            }
          }
          if (body.provider === 'google' && body.firebaseUid) {
            const conflict = await db.query.users.findFirst({ where: and(eq(users.firebaseUid, body.firebaseUid), eq(users.userType, user.userType)) });
            if (conflict && conflict.id !== user.id) {
              return {
                success: false,
                error: "PROVIDER_CONFLICT",
                message: "This Google account is already linked to another user.",
              };
            }
          }
        } else {
          // Sign-in flow: resolve user by provider identifiers
          // Check user based on provider type
          if (body.provider === 'apple' && body.appleUserId) {
            // For Apple: First try appleUserId, then email
            user = await db.query.users.findFirst({
              where: eq(users.appleUserId, body.appleUserId),
            });
  
            // If not found by appleUserId but email exists, check by email
            if (!user && body.email) {
              user = await db.query.users.findFirst({
                where: eq(users.email, body.email),
              });
  
              // If found by email and no other provider is linked, allow re-linking
              if (user && !user.authProvider) {
                log.info({ userId: user.id }, "Re-linking Apple account to existing user");
              }
            }
          } else if (body.provider === 'google') {
            // For Google: First try firebaseUid, then email
            user = await db.query.users.findFirst({
              where: body.firebaseUid
                ? eq(users.firebaseUid, body.firebaseUid)
                : undefined,
            });
  
            // If not found by firebaseUid but email exists, check by email
            if (!user && body.email) {
              user = await db.query.users.findFirst({
                where: eq(users.email, body.email),
              });
  
              // If found by email and no other provider is linked, allow re-linking
              if (user && !user.authProvider) {
                log.info({ userId: user.id }, "Re-linking Google account to existing user");
              }
            }
          } else {
            // Fallback for other providers
            user = await db.query.users.findFirst({
              where: body.firebaseUid
                ? eq(users.firebaseUid, body.firebaseUid)
                : body.email
                  ? eq(users.email, body.email)
                  : undefined,
            });
          }
        }

        if (body.provider === 'apple' && body.appleUserId) {
          // For Apple: First try appleUserId, then email
          user = await db.query.users.findFirst({
            where: eq(users.appleUserId, body.appleUserId),
          });

          // If not found by appleUserId but email exists, check by email
          if (!user && body.email) {
            user = await db.query.users.findFirst({
              where: eq(users.email, body.email),
            });

            // If found by email and no other provider is linked, allow re-linking
            if (user && !user.authProvider) {
              log.info({ userId: user.id }, "Re-linking Apple account to existing user");
            }
          }
        } else if (body.provider === 'google') {
          // For Google: First try firebaseUid, then email
          user = await db.query.users.findFirst({
            where: body.firebaseUid
              ? eq(users.firebaseUid, body.firebaseUid)
              : undefined,
          });

          // If not found by firebaseUid but email exists, check by email
          if (!user && body.email) {
            user = await db.query.users.findFirst({
              where: eq(users.email, body.email),
            });

            // If found by email and no other provider is linked, allow re-linking
            if (user && !user.authProvider) {
              log.info({ userId: user.id }, "Re-linking Google account to existing user");
            }
          }
        } else {
          // Fallback for other providers
          user = await db.query.users.findFirst({
            where: body.firebaseUid
              ? eq(users.firebaseUid, body.firebaseUid)
              : body.email
                ? eq(users.email, body.email)
                : undefined,
          });
        }

        if (!user) {
          // New user - return indication to continue with registration
          log.info(
            { firebaseUid: body.firebaseUid, email: body.email },
            "New social auth user - needs registration"
          );

          return {
            success: true,
            userExists: false,
            profileComplete: false,
            message: "Please complete registration",
          };
        }

        // Check if user is soft-deleted and reactivate if needed
        if (user.deletedAt) {
          log.info(
            { userId: user.id, deletedAt: user.deletedAt },
            "Reactivating soft-deleted user via social auth"
          );

          await db
            .update(users)
            .set({
              deletedAt: null,
              updatedAt: new Date(),
            })
            .where(eq(users.id, user.id));

          user.deletedAt = null;
        }

        // Check if user is trying to link a different social provider
        // Allow re-linking if no provider is currently linked
        if (!currentUserId && user.authProvider && user.authProvider !== body.provider) {
          log.warn(
            {
              userId: user.id,
              existingProvider: user.authProvider,
              attemptedProvider: body.provider,
            },
            "User attempting to link different social provider"
          );

          return {
            success: false,
            userExists: true,
            profileComplete: !!user.firstName,
            error: "PROVIDER_CONFLICT",
            message: `Bu hesap zaten ${user.authProvider === 'apple' ? 'Apple' : 'Google'} ile bağlı. ${body.provider === 'apple' ? 'Apple' : 'Google'} ile giriş yapmak için önce Ayarlar > Güvenlik > Bağlı Hesaplar'dan mevcut bağlantıyı kaldırın.`,
            existingProvider: user.authProvider,
            attemptedProvider: body.provider,
            suggestedAction: "unlink_first",
          };
        }

        // Allow re-linking if provider was previously unlinked
        if (!user.authProvider && user.email && body.email === user.email) {
          log.info(
            {
              userId: user.id,
              provider: body.provider,
              email: user.email,
            },
            "Re-linking social provider to existing account"
          );
        }

        // Check if profile is complete
        if (!user.firstName) {
          // Profile incomplete - need to complete registration
          log.info(
            {
              userId: user.id,
              hasProfile: false,
              phoneVerified: user.phoneNumberVerified
            },
            "Social auth user needs profile completion"
          );

          return {
            success: true,
            userExists: true,  // User exists in DB
            profileComplete: false,  // But profile not complete
            message: "Please complete your profile",
          };
        }

        // Profile complete - allow login regardless of phone verification
        // (Social auth already provides identity verification)
        if (!user.phoneNumberVerified) {
          log.info(
            {
              userId: user.id,
              phoneNumber: user.phoneNumber,
              phoneVerified: false
            },
            "Social auth login with unverified phone (allowed)"
          );
        }

        // User exists with complete profile - update auth provider if needed and generate tokens
        // Update auth provider and Apple User ID if needed
        const updateData: any = {};
        if (user.authProvider !== body.provider) {
          updateData.authProvider = body.provider;
        }
        if (body.provider === 'apple' && body.appleUserId && user.appleUserId !== body.appleUserId) {
          updateData.appleUserId = body.appleUserId;
        }
        if (body.firebaseUid && user.firebaseUid !== body.firebaseUid) {
          updateData.firebaseUid = body.firebaseUid;
        }
        if (body.email && !user.email) {
          updateData.email = body.email;
        }

        if (Object.keys(updateData).length > 0) {
          updateData.updatedAt = new Date();
          await db
            .update(users)
            .set(updateData)
            .where(eq(users.id, user.id));
        }

        const deviceInfo = extractDeviceInfo(headers);
        const deviceId = generateDeviceFingerprint(deviceInfo, headers);
        const sessionId = generateSessionId();
        const ipAddress = headers["x-forwarded-for"] || headers["x-real-ip"];

        const accessJTI = generateJTI();
        const refreshJTI = generateJTI();

        // Access token (15 minutes)
        const accessToken = await jwt.sign({
          sub: user.id,
          type: "access",
          sessionId,
          deviceId,
          jti: accessJTI,
          aud: "mobile-app",
          iss: "metropolitan-api",
          exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour (was 15 minutes)
        });

        // Refresh token (30 days)
        const refreshToken = await jwt.sign({
          sub: user.id,
          type: "refresh",
          sessionId,
          deviceId,
          jti: refreshJTI,
          aud: "mobile-app",
          iss: "metropolitan-api",
          exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
        });

        // Store device session and refresh token
        await storeDeviceSession(
          user.id,
          deviceId,
          sessionId,
          deviceInfo,
          ipAddress
        );
        await storeRefreshToken(
          user.id,
          refreshToken,
          deviceId,
          sessionId,
          refreshJTI
        );

        log.info({
          userId: user.id,
          deviceId,
          sessionId,
          provider: body.provider,
          message: "Social auth login successful",
        });

        // Return user data without sensitive fields
        const { password, ...safeUser } = user;

        if (currentUserId) {
          // Linking flow response: tokens still returned to keep client session fresh
          return {
            success: true,
            linked: true,
            message: "Social account linked successfully",
            accessToken,
            refreshToken,
            expiresIn: 900,
            user: safeUser,
          };
        }

        return {
          success: true,
          userExists: true,
          profileComplete: true,
          message: "Login successful",
          accessToken,
          refreshToken,
          expiresIn: 900, // 15 minutes in seconds
          user: safeUser,
        };
      },
      {
        body: t.Object({
          firebaseUid: t.String({ minLength: 1 }),
          email: t.Optional(t.String({ format: "email" })),
          provider: t.String({ enum: ["apple", "google"] }),
          appleUserId: t.Optional(t.String({ minLength: 1 })), // Apple's unique user identifier
        }),
      }
    )
  );

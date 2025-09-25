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
      async ({ body, headers, jwt, log, db }) => {
        log.info(
          {
            firebaseUid: body.firebaseUid,
            email: body.email,
            provider: body.provider
          },
          `Social auth attempt`
        );

        // Check if user exists by Firebase UID or email
        let user = await db.query.users.findFirst({
          where: body.firebaseUid
            ? eq(users.firebaseUid, body.firebaseUid)
            : body.email
              ? eq(users.email, body.email)
              : undefined,
        });

        // If user doesn't exist, check by email for existing account
        if (!user && body.email) {
          user = await db.query.users.findFirst({
            where: eq(users.email, body.email),
          });

          // If found by email, update with Firebase UID and auth provider
          if (user) {
            await db
              .update(users)
              .set({
                firebaseUid: body.firebaseUid,
                authProvider: body.provider,
                updatedAt: new Date(),
              })
              .where(eq(users.id, user.id));
          }
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
            message: "Please complete registration",
          };
        }

        // Check if profile is complete
        if (!user.firstName) {
          // Profile incomplete - return indication to continue with registration
          log.info(
            { userId: user.id },
            "Social auth user profile incomplete"
          );

          return {
            success: true,
            userExists: false,
            message: "Please complete your profile",
          };
        }

        // User exists with complete profile - update auth provider if needed and generate tokens
        // Update auth provider if it's different or not set
        if (user.authProvider !== body.provider) {
          await db
            .update(users)
            .set({
              authProvider: body.provider,
              updatedAt: new Date(),
            })
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
          exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
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

        return {
          success: true,
          userExists: true,
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
        }),
      }
    )
  );
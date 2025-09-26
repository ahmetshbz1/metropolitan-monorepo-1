// "otp.routes.ts"
// metropolitan backend
// OTP operations routes (send and verify)

import { logger } from "@bogeychan/elysia-logger";
import { and, eq } from "drizzle-orm";
import { t } from "elysia";

import { users } from "../../../../shared/infrastructure/database/schema";
import {
  createRateLimiter,
  rateLimitConfigs,
} from "../../../../shared/infrastructure/middleware/rate-limit";
import { createApp } from "../../../../shared/infrastructure/web/app";
import {
  createLoginOtp,
  createRegistrationOtp,
  verifyLoginOtp,
  verifyRegistrationOtp,
} from "../../application/use-cases/otp.service";
import {
  extractDeviceInfo,
  generateDeviceFingerprint,
  generateJTI,
  generateSessionId,
  storeDeviceSession,
  storeRefreshToken,
} from "../../infrastructure/security/device-fingerprint";
import { getLanguageFromHeader } from "../../infrastructure/templates/sms-templates";

import { phoneNumberSchema, userTypeEnum } from "./auth-guards";

export const otpRoutes = createApp()
  .use(logger({ level: "info" }))
  .group("/auth", (app) =>
    app
      // Send OTP endpoint with rate limiting
      .use(createRateLimiter(rateLimitConfigs.otpSend))
      .post(
        "/send-otp",
        async ({ body, headers, log, db }) => {
          // Get user's preferred language from Accept-Language header
          const language = getLanguageFromHeader(headers["accept-language"]);

          // Check if this is a new registration or login
          const existingUser = await db.query.users.findFirst({
            where: and(
              eq(users.phoneNumber, body.phoneNumber),
              eq(users.userType, body.userType)
            ),
          });

          // Clear logic: separate user existence from profile completion
          const isRegisteredUser = !!existingUser;
          const hasCompleteProfile = existingUser?.firstName ? true : false;
          const needsRegistration = !isRegisteredUser;

          // Send appropriate OTP type based on registration status
          if (needsRegistration) {
            await createRegistrationOtp(body.phoneNumber, language);
          } else {
            await createLoginOtp(body.phoneNumber, language);
          }

          log.info(
            {
              phoneNumber: body.phoneNumber,
              userType: body.userType,
              action: needsRegistration ? "register" : "login",
              hasCompleteProfile,
              language,
            },
            `OTP sent successfully`
          );

          return {
            success: true,
            message: "OTP sent successfully",
            isNewUser: needsRegistration, // True if user doesn't exist
            needsProfileCompletion: isRegisteredUser && !hasCompleteProfile, // True if exists but incomplete
          };
        },
        {
          body: t.Object({
            phoneNumber: t.String(phoneNumberSchema),
            userType: t.String({ enum: userTypeEnum }),
          }),
        }
      )

      // Verify OTP endpoint with rate limiting
      .use(createRateLimiter(rateLimitConfigs.otpVerify))
      .post(
        "/verify-otp",
        async ({ body, headers, jwt, log, db }) => {
          log.info(
            { phoneNumber: body.phoneNumber, userType: body.userType },
            `Attempting to verify OTP`
          );

          // Check if user exists to determine action type
          const existingUser = await db.query.users.findFirst({
            where: and(
              eq(users.phoneNumber, body.phoneNumber),
              eq(users.userType, body.userType)
            ),
          });

          const isNewUser = !existingUser || !existingUser.firstName;
          const verifySuccess = isNewUser
            ? await verifyRegistrationOtp(body.phoneNumber, body.otpCode)
            : await verifyLoginOtp(body.phoneNumber, body.otpCode);

          if (verifySuccess) {
            // First check for soft-deleted user
            let user = await db.query.users.findFirst({
              where: and(
                eq(users.phoneNumber, body.phoneNumber),
                eq(users.userType, body.userType)
              ),
            });

            // If user exists but is soft-deleted, reactivate
            if (user && user.deletedAt) {
              log.info(
                `Reactivating soft-deleted account for ${body.phoneNumber}`
              );
              await db
                .update(users)
                .set({
                  deletedAt: null,
                  updatedAt: new Date(),
                })
                .where(eq(users.id, user.id));

              // Refresh user data
              user = await db.query.users.findFirst({
                where: eq(users.id, user.id),
              });
            }

            if (!user) {
              log.info(
                `User with phone number ${body.phoneNumber} and type ${body.userType} not found. Creating new user.`
              );
              const newUser = await db
                .insert(users)
                .values({
                  phoneNumber: body.phoneNumber,
                  phoneNumberVerified: true, // OTP verified, so phone is verified
                  userType: body.userType,
                })
                .returning();
              user = newUser[0];
            } else if (!user.phoneNumberVerified) {
              // Existing user but phone not verified, update it
              log.info(
                `Updating phone verification status for user ${user.id}`
              );
              await db
                .update(users)
                .set({
                  phoneNumberVerified: true,
                  updatedAt: new Date(),
                })
                .where(eq(users.id, user.id));
              user = { ...user, phoneNumberVerified: true };
            }

            if (!user) {
              return {
                success: false,
                message: "Could not create or find user.",
              };
            }

            // Extract device info for fingerprinting
            const deviceInfo = extractDeviceInfo(headers);
            const deviceId = generateDeviceFingerprint(deviceInfo, headers);
            const sessionId = generateSessionId();
            const ipAddress =
              headers["x-forwarded-for"] || headers["x-real-ip"];

            // Check if profile is complete
            if (user.firstName) {
              // Profile complete, issue enhanced tokens
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
                message: "Login successful with enhanced security",
              });

              return {
                success: true,
                message: "Login successful.",
                accessToken,
                refreshToken,
                expiresIn: 900, // 15 minutes in seconds
              };
            }

            // Profile incomplete, issue registration token
            const registrationToken = await jwt.sign({
              sub: "registration", // Subject claim to identify the token's purpose
              userId: user.id, // Include user ID to prevent race conditions
              phoneNumber: user.phoneNumber,
              userType: user.userType,
              exp: Math.floor(Date.now() / 1000) + 5 * 60, // 5 minutes expiration
            });

            return {
              success: true,
              message: "OTP verified. Please complete your profile.",
              registrationToken,
            };
          }

          return { success: false, message: "Invalid or expired OTP code." };
        },
        {
          body: t.Object({
            phoneNumber: t.String(phoneNumberSchema),
            otpCode: t.String({ minLength: 6, maxLength: 6 }),
            userType: t.String({ enum: userTypeEnum }),
          }),
        }
      )
  );

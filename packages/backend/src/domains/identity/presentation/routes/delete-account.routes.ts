// "delete-account.routes.ts"
// metropolitan backend
// Account deletion with OTP verification

import { logger } from "@bogeychan/elysia-logger";
import { and, eq, isNull } from "drizzle-orm";
import { t } from "elysia";

import { users } from "../../../../shared/infrastructure/database/schema";
import { createApp } from "../../../../shared/infrastructure/web/app";
import { createDeleteAccountOtp, verifyDeleteAccountOtp } from "../../application/use-cases/otp.service";
import { getLanguageFromHeader } from "../../infrastructure/templates/sms-templates";
import { authTokenGuard, phoneNumberSchema, extractToken } from "./auth-guards";
import { blacklistToken } from "../../../../shared/infrastructure/database/redis";
import {
  invalidateAllUserSessions,
  removeAllUserRefreshTokens
} from "../../infrastructure/security/device-fingerprint";

export const deleteAccountRoutes = createApp()
  .use(logger({ level: "info" }))
  .use(authTokenGuard)
  .group("/auth/account", (app) =>
    app
      // Send OTP for account deletion
      .post(
        "/delete/send-otp",
        async ({ body, profile, headers, log, db }) => {
          // Extract userId from JWT structure
          const userId = profile?.sub || profile?.userId;
          if (!profile || !userId) {
            return { success: false, message: "Unauthorized" };
          }

          // Get user from database
          const user = await db.query.users.findFirst({
            where: and(
              eq(users.id, userId),
              isNull(users.deletedAt)
            ),
          });

          if (!user) {
            return { success: false, message: "User not found" };
          }

          // Verify phone number matches
          if (user.phoneNumber !== body.phoneNumber) {
            return { success: false, message: "Phone number does not match account" };
          }

          // Get user's preferred language from Accept-Language header
          const language = getLanguageFromHeader(headers['accept-language']);

          // Send OTP with delete_account action
          await createDeleteAccountOtp(body.phoneNumber, language);
          log.info(
            { userId: user.id, phoneNumber: body.phoneNumber, language },
            `Account deletion OTP sent`
          );

          return { success: true, message: "OTP sent successfully" };
        },
        {
          body: t.Object({
            phoneNumber: t.String(phoneNumberSchema),
          }),
        }
      )

      // Verify OTP and soft delete account
      .post(
        "/delete/verify-otp",
        async ({ body, profile, log, db, headers }) => {
          // Extract userId from JWT structure
          const userId = profile?.sub || profile?.userId;
          if (!profile || !userId) {
            return { success: false, message: "Unauthorized" };
          }

          // Get user from database
          const user = await db.query.users.findFirst({
            where: and(
              eq(users.id, userId),
              isNull(users.deletedAt)
            ),
          });

          if (!user) {
            return { success: false, message: "User not found" };
          }

          // Verify phone number matches
          if (user.phoneNumber !== body.phoneNumber) {
            return { success: false, message: "Phone number does not match account" };
          }

          // Verify OTP with delete_account action
          const isValid = await verifyDeleteAccountOtp(body.phoneNumber, body.otpCode);
          if (!isValid) {
            return { success: false, message: "Invalid or expired OTP code" };
          }

          // Soft delete the user
          await db
            .update(users)
            .set({
              deletedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(users.id, user.id));

          // IMPORTANT: Clear all Redis data for security
          try {
            // 1. Invalidate all device sessions
            await invalidateAllUserSessions(user.id);

            // 2. Remove all refresh tokens
            await removeAllUserRefreshTokens(user.id);

            // 3. Blacklist current access token
            const token = extractToken(headers.authorization);
            if (token && profile.exp) {
              const expiresIn = profile.exp - Math.floor(Date.now() / 1000);
              if (expiresIn > 0) {
                await blacklistToken(token, expiresIn);
              }
            }

            log.info(
              { userId: user.id },
              `Account soft deleted and all sessions cleared successfully`
            );
          } catch (error) {
            log.error(
              { userId: user.id, error },
              `Failed to clear Redis data after account deletion`
            );
            // Don't fail the deletion if Redis cleanup fails
          }

          return {
            success: true,
            message: "Account deleted successfully. You have 20 days to reactivate by logging in."
          };
        },
        {
          body: t.Object({
            phoneNumber: t.String(phoneNumberSchema),
            otpCode: t.String({ minLength: 6, maxLength: 6 }),
          }),
        }
      )
  );
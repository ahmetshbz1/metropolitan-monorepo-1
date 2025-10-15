// "otp.routes.ts"
// metropolitan backend
// OTP operations routes (send and verify)

import { logger } from "@bogeychan/elysia-logger";
import { and, eq } from "drizzle-orm";

import { users } from "../../../../shared/infrastructure/database/schema";
import {
  createRateLimiter,
  rateLimitConfigs,
} from "../../../../shared/infrastructure/middleware/rate-limit";
import { createApp } from "../../../../shared/infrastructure/web/app";
import {
  verifyLoginOtp,
  verifyRegistrationOtp,
} from "../../application/use-cases/otp.service";

import { handleSendOtp } from "./otp-send-handler";
import { reactivateSoftDeletedUser } from "./otp-user-reactivator";
import {
  createNewUserFromOtp,
  updatePhoneVerification,
} from "./otp-user-creator";
import { updateExistingSocialAuth } from "./otp-social-updater";
import {
  generateFullLoginTokens,
  generateRegistrationToken,
} from "./otp-token-generator";
import {
  sendOtpBodySchema,
  verifyOtpBodySchema,
  type UserRecord,
} from "./otp-types";

export const otpRoutes = createApp()
  .use(logger({ level: "info" }))
  .group("/auth", (app) =>
    app
      // Send OTP endpoint with rate limiting
      .use(createRateLimiter(rateLimitConfigs.otpSend))
      .post(
        "/send-otp",
        async ({ body, headers, log, db }) => {
          return await handleSendOtp(body, headers, db, log);
        },
        {
          body: sendOtpBodySchema,
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

          if (!verifySuccess) {
            return {
              success: false,
              message: "Invalid or expired OTP code.",
            };
          }

          // First check for soft-deleted user
          let user = (await db.query.users.findFirst({
            where: and(
              eq(users.phoneNumber, body.phoneNumber),
              eq(users.userType, body.userType)
            ),
          })) as UserRecord | undefined;

          // If user exists but is soft-deleted, reactivate
          if (user && user.deletedAt) {
            user = await reactivateSoftDeletedUser(db, user, log);
          }

          // Handle user creation or verification update
          if (!user) {
            user = await createNewUserFromOtp(db, body, log);
          } else if (!user.phoneNumberVerified) {
            user = await updatePhoneVerification(db, user, log);
          }

          if (!user) {
            return {
              success: false,
              message: "Could not create or find user.",
            };
          }

          // Update social auth data if provided for existing user
          user = await updateExistingSocialAuth(
            db,
            user,
            body,
            existingUser as UserRecord
          );

          // Check if profile is complete and generate appropriate tokens
          if (user.firstName) {
            return await generateFullLoginTokens(user, headers, jwt, log);
          }

          return await generateRegistrationToken(user, jwt);
        },
        {
          body: verifyOtpBodySchema,
        }
      )
  );

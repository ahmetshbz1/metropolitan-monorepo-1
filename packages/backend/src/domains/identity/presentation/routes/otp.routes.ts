// "otp.routes.ts"
// metropolitan backend
// OTP operations routes (send and verify)

import { logger } from "@bogeychan/elysia-logger";
import { and, eq } from "drizzle-orm";
import { t } from "elysia";
import { users } from "../../../../shared/infrastructure/database/schema";
import { createApp } from "../../../../shared/infrastructure/web/app";
import { createOtp, verifyOtp } from "../../application/use-cases/otp.service";
import { phoneNumberSchema, userTypeEnum } from "./auth-guards";

export const otpRoutes = createApp()
  .use(logger({ level: "info" }))
  .group("/auth", (app) =>
    app
      // Send OTP endpoint
      .post(
        "/send-otp",
        async ({ body, log }) => {
          await createOtp(body.phoneNumber);
          log.info(
            { phoneNumber: body.phoneNumber, userType: body.userType },
            `OTP sent successfully`
          );
          return { success: true, message: "OTP sent successfully" };
        },
        {
          body: t.Object({
            phoneNumber: t.String(phoneNumberSchema),
            userType: t.String({ enum: userTypeEnum }),
          }),
        }
      )
      
      // Verify OTP endpoint
      .post(
        "/verify-otp",
        async ({ body, jwt, log, db }) => {
          log.info(
            { phoneNumber: body.phoneNumber, userType: body.userType },
            `Attempting to verify OTP`
          );
          
          if (await verifyOtp(body.phoneNumber, body.otpCode)) {
            // Find or create user
            let user = await db.query.users.findFirst({
              where: and(
                eq(users.phoneNumber, body.phoneNumber),
                eq(users.userType, body.userType)
              ),
            });

            if (!user) {
              log.info(
                `User with phone number ${body.phoneNumber} and type ${body.userType} not found. Creating new user.`
              );
              const newUser = await db
                .insert(users)
                .values({
                  phoneNumber: body.phoneNumber,
                  userType: body.userType,
                })
                .returning();
              user = newUser[0];
            }

            if (!user) {
              return {
                success: false,
                message: "Could not create or find user.",
              };
            }

            // Check if profile is complete
            if (user.firstName) {
              // Profile complete, issue full login token
              const token = await jwt.sign({
                userId: user.id,
                exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
              });
              return { success: true, message: "Login successful.", token };
            }

            // Profile incomplete, issue registration token
            const registrationToken = await jwt.sign({
              sub: "registration", // Subject claim to identify the token's purpose
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
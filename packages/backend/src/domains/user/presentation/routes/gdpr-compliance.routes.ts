// "gdpr-compliance.routes.ts"
// metropolitan backend
// GDPR compliance endpoints (Article 17 - Right to be Forgotten)

import { logger } from "@bogeychan/elysia-logger";
import { and, eq } from "drizzle-orm";
import { t } from "elysia";

import { users, orders, addresses, cartItems } from "../../../../shared/infrastructure/database/schema";
import {
  createRateLimiter,
  rateLimitConfigs,
} from "../../../../shared/infrastructure/middleware/rate-limit";
import { createApp } from "../../../../shared/infrastructure/web/app";
import {
  invalidateAllUserSessions,
  getUserSessions,
} from "../../../identity/infrastructure/security/device-fingerprint";
import { authTokenGuard } from "../../../identity/presentation/routes/auth-guards";

// Audit log interface
interface GDPRAction {
  userId: string;
  action: "DATA_EXPORT" | "DATA_DELETION" | "DATA_RECTIFICATION" | "CONSENT_WITHDRAWAL";
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

// GDPR audit logger
async function logGDPRAction(action: GDPRAction): Promise<void> {
  // Store in a secure audit log (could be a separate database)
  logger.info({
    ...action,
    timestamp: action.timestamp.toISOString(),
  }, "GDPR audit log");

  // In production, this should write to a secure, tamper-proof audit log
  // Consider using append-only storage or blockchain for compliance
}

export const gdprComplianceRoutes = createApp()
  .use(logger({ level: "info" }))
  .use(authTokenGuard)
  .group("/gdpr", (app) =>
    app
      // Get all user data (Article 15 - Right of Access)
      .use(createRateLimiter(rateLimitConfigs.gdprExport))
      .get(
        "/my-data",
        async ({ profile, headers, log, db }) => {
          // Extract userId from JWT structure
          const userId = profile?.sub || profile?.userId;
          if (!profile || !userId) {
            return { success: false, message: "Unauthorized" };
          }

          try {
            // Collect all user data
            const userData = await db.query.users.findFirst({
              where: eq(users.id, userId),
            });

            const userAddresses = await db.query.addresses.findMany({
              where: eq(addresses.userId, userId),
            });

            const userOrders = await db.query.orders.findMany({
              where: eq(orders.userId, userId),
              with: {
                items: true,
              },
            });

            const userCart = await db.query.cartItems.findMany({
              where: eq(cartItems.userId, userId),
            });

            // Get active sessions
            const activeSessions = await getUserSessions(userId);

            // Log GDPR action
            await logGDPRAction({
              userId: userId,
              action: "DATA_EXPORT",
              timestamp: new Date(),
              ipAddress: headers["x-forwarded-for"] || headers["x-real-ip"],
              userAgent: headers["user-agent"],
            });

            log.info(
              { userId: userId },
              `GDPR data export requested`
            );

            return {
              success: true,
              data: {
                personalInfo: userData,
                addresses: userAddresses,
                orders: userOrders,
                cart: userCart,
                activeSessions: activeSessions.map(s => ({
                  deviceId: s.deviceId,
                  createdAt: new Date(s.createdAt),
                  lastActivity: new Date(s.lastActivity),
                  deviceInfo: s.deviceInfo,
                })),
                exportDate: new Date().toISOString(),
              },
            };
          } catch (error: any) {
            log.error(
              { userId: userId, error: error.message },
              `GDPR data export failed`
            );
            return {
              success: false,
              message: "Failed to export data",
            };
          }
        }
      )

      // NOTE: Account deletion (Article 17 - Right to be Forgotten) is handled in
      // delete-account.routes.ts with 20-day soft delete period as per business requirements

// Update personal data (Article 16 - Right to Rectification)
      .put(
        "/rectify-data",
        async ({ body, profile, headers, log, db }) => {
          // Extract userId from JWT structure
          const userId = profile?.sub || profile?.userId;
          if (!profile || !userId) {
            return { success: false, message: "Unauthorized" };
          }

          try {
            // Update only allowed fields
            const allowedUpdates: Record<string, any> = {};

            if (body.firstName) allowedUpdates.firstName = body.firstName;
            if (body.lastName) allowedUpdates.lastName = body.lastName;
            if (body.email) allowedUpdates.email = body.email;

            if (Object.keys(allowedUpdates).length === 0) {
              return {
                success: false,
                message: "No valid fields to update",
              };
            }

            // Update user data
            allowedUpdates.updatedAt = new Date();

            await db
              .update(users)
              .set(allowedUpdates)
              .where(eq(users.id, userId));

            // Log GDPR action
            await logGDPRAction({
              userId: userId,
              action: "DATA_RECTIFICATION",
              timestamp: new Date(),
              ipAddress: headers["x-forwarded-for"] || headers["x-real-ip"],
              userAgent: headers["user-agent"],
              details: {
                updatedFields: Object.keys(allowedUpdates),
              },
            });

            log.info(
              { userId: userId, updatedFields: Object.keys(allowedUpdates) },
              `Personal data rectified (GDPR Article 16)`
            );

            return {
              success: true,
              message: "Personal data updated successfully",
            };
          } catch (error: any) {
            log.error(
              { userId: userId, error: error.message },
              `Data rectification failed`
            );
            return {
              success: false,
              message: "Failed to update data",
            };
          }
        },
        {
          body: t.Object({
            firstName: t.Optional(t.String()),
            lastName: t.Optional(t.String()),
            email: t.Optional(t.String({ format: "email" })),
          }),
        }
      )

      // Withdraw consent (Article 7 - Withdrawal of Consent)
      .post(
        "/withdraw-consent",
        async ({ body, profile, headers, log, db }) => {
          // Extract userId from JWT structure
          const userId = profile?.sub || profile?.userId;
          if (!profile || !userId) {
            return { success: false, message: "Unauthorized" };
          }

          try {
            // Update consent preferences
            const consentUpdate: Record<string, any> = {
              updatedAt: new Date(),
            };

            // Handle different consent types
            if (body.consentType === "marketing") {
              consentUpdate.marketingConsent = false;
            } else if (body.consentType === "analytics") {
              consentUpdate.analyticsConsent = false;
            } else if (body.consentType === "all") {
              consentUpdate.marketingConsent = false;
              consentUpdate.analyticsConsent = false;
              consentUpdate.thirdPartyConsent = false;
            }

            await db
              .update(users)
              .set(consentUpdate)
              .where(eq(users.id, userId));

            // Log GDPR action
            await logGDPRAction({
              userId: userId,
              action: "CONSENT_WITHDRAWAL",
              timestamp: new Date(),
              ipAddress: headers["x-forwarded-for"] || headers["x-real-ip"],
              userAgent: headers["user-agent"],
              details: {
                consentType: body.consentType,
              },
            });

            log.info(
              { userId: userId, consentType: body.consentType },
              `Consent withdrawn (GDPR Article 7)`
            );

            return {
              success: true,
              message: "Consent withdrawn successfully",
            };
          } catch (error: any) {
            log.error(
              { userId: userId, error: error.message },
              `Consent withdrawal failed`
            );
            return {
              success: false,
              message: "Failed to withdraw consent",
            };
          }
        },
        {
          body: t.Object({
            consentType: t.Union([
              t.Literal("marketing"),
              t.Literal("analytics"),
              t.Literal("all"),
            ]),
          }),
        }
      )
  );
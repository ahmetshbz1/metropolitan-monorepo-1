import { Elysia, t } from "elysia";
import { eq } from "drizzle-orm";

import { db } from "../../../../shared/infrastructure/database/connection";
import {
  paymentTermsSettings,
  userPaymentTerms,
  users,
} from "../../../../shared/infrastructure/database/schema";
import { isAuthenticated } from "../../../../shared/application/guards/auth.guard";

export const paymentTermsRoutes = new Elysia({ prefix: "/payment-terms" })
  .get(
    "/available",
    async ({ query }) => {
      const { userId } = query;

      let terms: number[] = [7, 14, 21];

      if (userId) {
        const user = await db.query.users.findFirst({
          where: eq(users.id, userId),
        });

        if (user?.userType === "corporate") {
          const userTerms = await db.query.userPaymentTerms.findFirst({
            where: eq(userPaymentTerms.userId, userId),
          });

          if (userTerms?.isEnabled && userTerms.customTerms) {
            terms = userTerms.customTerms
              .split(",")
              .map((t: string) => parseInt(t.trim()))
              .filter((t: number) => !isNaN(t));
          } else {
            const globalSettings = await db.query.paymentTermsSettings.findFirst({
              where: eq(paymentTermsSettings.isGlobalDefault, true),
            });

            if (globalSettings?.availableTerms) {
              terms = globalSettings.availableTerms
                .split(",")
                .map((t: string) => parseInt(t.trim()))
                .filter((t: number) => !isNaN(t));
            }
          }
        } else {
          return {
            success: true,
            data: [],
          };
        }
      }

      const termOptions = terms.map((days) => ({
        days,
        label: `${days} gün`,
      }));

      return {
        success: true,
        data: termOptions,
      };
    },
    {
      query: t.Object({
        userId: t.Optional(t.String()),
      }),
    }
  )

  .use(isAuthenticated)
  .get(
    "/user/:userId",
    async ({ params }) => {
      const { userId } = params;

      const userTerms = await db.query.userPaymentTerms.findFirst({
        where: eq(userPaymentTerms.userId, userId),
      });

      return {
        success: true,
        data: userTerms,
      };
    },
    {
      params: t.Object({
        userId: t.String(),
      }),
    }
  )

  .put(
    "/user/:userId",
    async ({ params, body }) => {
      const { userId } = params;
      const { customTerms, isEnabled } = body;

      const existingTerms = await db.query.userPaymentTerms.findFirst({
        where: eq(userPaymentTerms.userId, userId),
      });

      if (existingTerms) {
        await db
          .update(userPaymentTerms)
          .set({
            customTerms,
            isEnabled,
            updatedAt: new Date(),
          })
          .where(eq(userPaymentTerms.userId, userId));
      } else {
        await db.insert(userPaymentTerms).values({
          userId,
          customTerms,
          isEnabled,
        });
      }

      return {
        success: true,
        message: "Payment terms updated successfully",
      };
    },
    {
      params: t.Object({
        userId: t.String(),
      }),
      body: t.Object({
        customTerms: t.Optional(t.String()),
        isEnabled: t.Boolean(),
      }),
    }
  )

  .put(
    "/global",
    async ({ body }) => {
      const { availableTerms } = body;

      const existingSettings = await db.query.paymentTermsSettings.findFirst({
        where: eq(paymentTermsSettings.isGlobalDefault, true),
      });

      if (existingSettings) {
        await db
          .update(paymentTermsSettings)
          .set({
            availableTerms,
            updatedAt: new Date(),
          })
          .where(eq(paymentTermsSettings.id, existingSettings.id));
      } else {
        await db.insert(paymentTermsSettings).values({
          isGlobalDefault: true,
          availableTerms,
        });
      }

      return {
        success: true,
        message: "Global payment terms updated successfully",
      };
    },
    {
      body: t.Object({
        availableTerms: t.String(),
      }),
    }
  );

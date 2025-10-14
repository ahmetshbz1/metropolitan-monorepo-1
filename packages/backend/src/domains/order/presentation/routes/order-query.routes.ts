//  "order-query.routes.ts"
//  metropolitan backend
//  Order query and tracking routes

import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { logger } from "../../../../shared/infrastructure/monitoring/logger.config";
import { isAuthenticated } from "../../../../shared/application/guards/auth.guard";
import { db } from "../../../../shared/infrastructure/database/connection";
import { users } from "../../../../shared/infrastructure/database/schema";
import { OrderTrackingService } from "../../application/use-cases/order-tracking.service";

interface AuthenticatedContext {
  user: {
    id: string;
  };
}

export const orderQueryRoutes = new Elysia()
  .use(isAuthenticated)
  .resolve(async ({ profile, set }) => {
    if (!profile) throw new Error("Unauthorized");

    const userId = profile?.sub || profile?.userId;
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      set.status = 401;
      throw new Error("User not found");
    }

    return { user };
  })
  // List user's orders
  .get("/", async ({ user }: AuthenticatedContext) => {
    const orders = await OrderTrackingService.getUserOrders(user.id);
    return { orders };
  })
  // Get specific order details
  .get(
    "/:orderId",
    async ({
      user,
      params,
      headers,
    }: AuthenticatedContext & { params: { orderId: string }; headers: Record<string, string | undefined> }) => {
      const { orderId } = params;

      // Get language from Accept-Language header
      const acceptLanguage = headers["accept-language"];
      const language = acceptLanguage?.split(",")[0]?.split("-")[0]?.toLowerCase() || "en";
      const validLanguage = ["tr", "en", "pl"].includes(language) ? language : "en";

      try {
        logger.info(
          { orderId, userId: user.id, language: validLanguage, context: "OrderQueryRoutes" },
          "Fetching order details"
        );

        const [order, items, trackingEvents] = await Promise.all([
          OrderTrackingService.getOrderDetails(orderId, user.id),
          OrderTrackingService.getOrderItems(orderId, validLanguage),
          OrderTrackingService.getTrackingEvents(orderId),
        ]);

        logger.info(
          { orderId, context: "OrderQueryRoutes" },
          "Successfully fetched order details"
        );

        return {
          order,
          items,
          trackingEvents,
        };
      } catch (error) {
        logger.error(
          { orderId, error, context: "OrderQueryRoutes" },
          "Failed to fetch order details"
        );
        throw error;
      }
    },
    {
      params: t.Object({
        orderId: t.String({ format: "uuid" }),
      }),
    }
  )
  // Query order by tracking number
  .get(
    "/tracking/:trackingNumber",
    async ({
      user,
      params,
    }: AuthenticatedContext & { params: { trackingNumber: string } }) => {
      const { trackingNumber } = params;

      const order = await OrderTrackingService.getOrderByTrackingNumber(
        trackingNumber,
        user.id
      );
      const trackingEvents = await OrderTrackingService.getTrackingEvents(
        order.id
      );

      return {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          trackingNumber: order.trackingNumber,
          shippingCompany: order.shippingCompany,
          estimatedDelivery: order.estimatedDelivery,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        },
        trackingEvents,
      };
    },
    {
      params: t.Object({
        trackingNumber: t.String(),
      }),
    }
  );
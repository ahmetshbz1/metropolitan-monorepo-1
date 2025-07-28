//  "orders.routes.ts"
//  metropolitan backend
//  Created by Ahmet on 23.06.2025.

import type { OrderCreationRequest } from "@metropolitan/shared/types/order";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { isAuthenticated } from "../../../../shared/application/guards/auth.guard";
import { db } from "../../../../shared/infrastructure/database/connection";
import {
  orders,
  users,
} from "../../../../shared/infrastructure/database/schema";
import { InvoiceService } from "../../application/use-cases/invoice.service";
import { OrderCalculationService } from "../../application/use-cases/order-calculation.service";
import { OrderCreationService } from "../../application/use-cases/order-creation.service";
import { OrderTrackingService } from "../../application/use-cases/order-tracking.service";
import { OrderValidationService } from "../../application/use-cases/order-validation.service";

// Bu tip backend'e özel kalabilir
interface AuthenticatedContext {
  user: {
    id: string;
    // ... diğer user alanları
  };
}

export const createOrdersApp = () =>
  new Elysia({ prefix: "/orders" })
    .use(isAuthenticated)
    .resolve(async ({ profile }) => {
      if (!profile) throw new Error("Unauthorized");

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, profile.userId))
        .limit(1);

      if (!user) throw new Error("User not found");

      return { user };
    })

    // Sipariş oluştur (Checkout)
    .post(
      "/",
      async ({
        user,
        body,
      }: AuthenticatedContext & { body: OrderCreationRequest }) => {
        console.log("📦 Order creation request body:", JSON.stringify(body, null, 2));
        
        // Validasyonları çalıştır
        const { items: cartItems, validation } =
          await OrderValidationService.validateCartItems(user.id);

        if (!validation.isValid) {
          throw new Error(
            JSON.stringify({
              code: "INSUFFICIENT_STOCK",
              message: "Bazı ürünlerde stok yetersiz",
              details: validation.errors,
            })
          );
        }

        await OrderValidationService.validateAddress(
          body.shippingAddressId,
          user.id
        );
        if (body.billingAddressId) {
          await OrderValidationService.validateAddress(
            body.billingAddressId,
            user.id
          );
        }
        await OrderValidationService.validatePaymentMethod(
          body.paymentMethodId,
          user.id
        );

        // Sipariş öğelerini hazırla ve toplam tutarı hesapla
        const { orderItems, totalAmount } =
          OrderCalculationService.prepareOrderItems(cartItems);

        // Stripe ile siparişi oluştur
        const result = await OrderCreationService.createOrderWithStripe(
          user.id,
          body,
          orderItems,
          cartItems,
          totalAmount
        );

        return result;
      },
      {
        body: t.Object({
          shippingAddressId: t.String(),
          billingAddressId: t.Optional(t.String()),
          paymentMethodId: t.String(),
          notes: t.Optional(t.String()),
        }),
      }
    )

    // Kullanıcının siparişlerini listele
    .get("/", async ({ user }: AuthenticatedContext) => {
      const orders = await OrderTrackingService.getUserOrders(user.id);
      return { orders };
    })

    // Belirli bir siparişin detaylarını getir
    .get(
      "/:orderId",
      async ({
        user,
        params,
      }: AuthenticatedContext & { params: { orderId: string } }) => {
        const { orderId } = params;

        try {
          console.log(`📦 Fetching order details for orderId: ${orderId}, userId: ${user.id}`);
          
          const [order, items, trackingEvents] = await Promise.all([
            OrderTrackingService.getOrderDetails(orderId, user.id),
            OrderTrackingService.getOrderItems(orderId),
            OrderTrackingService.getTrackingEvents(orderId),
          ]);

          console.log(`✅ Successfully fetched order details for orderId: ${orderId}`);

          return {
            order,
            items,
            trackingEvents,
          };
        } catch (error) {
          console.error(`❌ Failed to fetch order details for orderId: ${orderId}`, error);
          throw error;
        }
      },
      {
        params: t.Object({
          orderId: t.String({ format: "uuid" }),
        }),
      }
    )

    // Kargo takip numarası ile sipariş sorgula
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
    )

    // Sipariş iptal et
    .delete(
      "/:orderId",
      async ({
        user,
        params,
      }: AuthenticatedContext & { params: { orderId: string } }) => {
        const { orderId } = params;

        // Önce siparişin kullanıcıya ait olduğunu ve iptal edilebilir durumda olduğunu kontrol et
        const order = await OrderTrackingService.getOrderDetails(
          orderId,
          user.id
        );

        if (!["pending", "confirmed"].includes(order.status)) {
          throw new Error("Bu sipariş artık iptal edilemez");
        }

        // Siparişi iptal et
        await db
          .update(orders)
          .set({
            status: "cancelled",
            cancelledAt: new Date(),
            cancelReason: "Müşteri talebi",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, orderId));

        // Sipariş durumu değiştiği için fatura cache'ini temizle
        await InvoiceService.invalidateInvoiceCache(orderId);

        return { message: "Sipariş başarıyla iptal edildi" };
      },
      {
        params: t.Object({
          orderId: t.String({ format: "uuid" }),
        }),
      }
    );

export const ordersRoutes = createOrdersApp();

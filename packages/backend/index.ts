// Load environment variables first
import "./src/shared/infrastructure/config/env.config";

import { randomBytes } from "crypto";

import { logger } from "@bogeychan/elysia-logger";
import { staticPlugin } from "@elysiajs/static";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import pretty from "pino-pretty";

// Performance optimization imports

// Shared Infrastructure

// Domain Routes
import { productRoutes } from "./src/domains/catalog/presentation/routes/products.routes";
import { contentRoutes } from "./src/domains/content/presentation/routes/content.routes";
import { guestRoutes } from "./src/domains/content/presentation/routes/guest.routes";
import { authRoutes } from "./src/domains/identity/presentation/routes/auth.routes";
import { changePhoneRoutes } from "./src/domains/identity/presentation/routes/change-phone.routes";
import { refreshTokenRoutes } from "./src/domains/identity/presentation/routes/refresh-token.routes";
import { invoicesRoutes } from "./src/domains/order/presentation/routes/invoices.routes";
import { ordersRoutes } from "./src/domains/order/presentation/routes/orders.routes";
import { paymentRoutes } from "./src/domains/payment/presentation/routes/payment.routes";
import { stripeWebhookRoutes } from "./src/domains/payment/presentation/routes/stripe-webhook.routes";
import { cartRoutes } from "./src/domains/shopping/presentation/routes/cart.routes";
import { favoritesRoutes } from "./src/domains/shopping/presentation/routes/favorites.routes";
import { addressRoutes } from "./src/domains/user/presentation/routes/address.routes";
import { dataExportRoutes } from "./src/domains/user/presentation/routes/data-export.routes";
import { gdprComplianceRoutes } from "./src/domains/user/presentation/routes/gdpr-compliance.routes";
import { notificationPreferencesRoutes } from "./src/domains/user/presentation/routes/notification-preferences.routes";
import { notificationsRoutes } from "./src/domains/user/presentation/routes/notifications.routes";
import { privacySettingsRoutes } from "./src/domains/user/presentation/routes/privacy-settings.routes";
import { profileRoutes } from "./src/domains/user/presentation/routes/profile.routes";
import { securitySettingsRoutes } from "./src/domains/user/presentation/routes/security-settings.routes";
import { healthRoutes } from "./src/shared/application/common/health.routes";
import { utilsRoutes } from "./src/shared/application/common/utils.routes";
import { db } from "./src/shared/infrastructure/database/connection";
import { compressionPlugin } from "./src/shared/infrastructure/middleware/compression";
import {
  corsConfig,
  securityHeaders,
} from "./src/shared/infrastructure/middleware/cors";
import { setupGlobalErrorHandlers } from "./src/shared/infrastructure/middleware/global-error-handler";
import {
  createRateLimiter,
  rateLimitConfigs,
} from "./src/shared/infrastructure/middleware/rate-limit";
import { initializeSentry } from "./src/shared/infrastructure/monitoring/sentry.config";

// Initialize Sentry monitoring
initializeSentry();

// Setup global error handlers for production stability
setupGlobalErrorHandlers();

const stream = pretty({
  colorize: true,
  translateTime: "SYS:standard",
  destination: process.stdout,
  sync: true,
});

// Git commit hash kaldırıldı - production'da gereksiz

export const app = new Elysia()
  .use(corsConfig()) // CORS configuration
  .use(securityHeaders()) // Security headers
  .use(createRateLimiter(rateLimitConfigs.default)) // Rate limiting
  .use(compressionPlugin) // Add compression before logging
  .use(
    logger({
      stream,
      level: "info",
    })
  )
  .use(
    swagger({
      documentation: {
        info: {
          title: "Metropolitan Food API",
          description: "Metropolitan Food Group API dokümantasyonu",
          version: "1.0.0",
        },
        servers: [
          {
            url:
              process.env.NODE_ENV === "production"
                ? "https://api.metropolitanfg.pl"
                : "http://localhost:3000",
            description:
              process.env.NODE_ENV === "production"
                ? "Production server"
                : "Development server",
          },
        ],
        tags: [
          { name: "Auth", description: "Kimlik doğrulama işlemleri" },
          { name: "Users", description: "Kullanıcı işlemleri" },
          { name: "Products", description: "Ürün işlemleri" },
          { name: "Orders", description: "Sipariş işlemleri" },
          { name: "Cart", description: "Sepet işlemleri" },
          { name: "Content", description: "İçerik işlemleri" },
          { name: "Utils", description: "Yardımcı işlemler" },
        ],
      },
    })
  )
  .decorate("db", db)

  // Health check routes (global level)
  .use(healthRoutes)

  // Stripe webhook routes (root level - not in API group)
  .use(stripeWebhookRoutes)

  .get("/", () => `Welcome to Metropolitan!`, {
    beforeHandle(context) {
      (context.store as { rootReqStartTime?: bigint }).rootReqStartTime =
        process.hrtime.bigint();
    },
    afterHandle({ response, store }) {
      const { rootReqStartTime } = store as { rootReqStartTime: bigint };
      const duration = process.hrtime.bigint() - rootReqStartTime;
      const durationInMs = Number(duration) / 1_000_000;
      const requestId = randomBytes(8).toString("hex");

      if (typeof response === "string") {
        return `${response} (${requestId}) in ${durationInMs.toPrecision(15)}ms.`;
      }
      return response;
    },
  })
  .group("/api", (app) =>
    app
      // Identity Domain
      .use(authRoutes)
      .use(changePhoneRoutes)
      .use(refreshTokenRoutes)

      // User Domain (grouped under /users prefix)
      .group("/users", (userApp) =>
        userApp
          .use(profileRoutes)
          .use(addressRoutes)
          .use(favoritesRoutes)
          .use(notificationsRoutes)
          .use(notificationPreferencesRoutes)
          .use(privacySettingsRoutes)
          .use(securitySettingsRoutes)
          .use(dataExportRoutes)
          .use(gdprComplianceRoutes)
      )

      // Cart routes (directly under /api for /me/cart)
      .use(cartRoutes)

      // Payment routes
      .use(paymentRoutes)

      // Catalog Domain
      .use(productRoutes)

      // Order Domain
      .use(ordersRoutes)
      .use(invoicesRoutes)

      // Content Domain
      .use(guestRoutes)
      .use(contentRoutes)

      // Shared Utils
      .use(utilsRoutes)
  )
  .use(
    staticPlugin({
      assets: "public",
      prefix: "",
    })
  );

if (process.env.NODE_ENV !== "test") {
  app.listen({ port: 3000, hostname: "0.0.0.0" });
  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
  );
  if (process.env.NODE_ENV !== "production") {
    console.log(`📱 For local development, use your machine's IP address`);
  }
}

// Load environment variables first
import './src/shared/infrastructure/config/env.config';

import { logger } from "@bogeychan/elysia-logger";
import { staticPlugin } from "@elysiajs/static";
import { swagger } from "@elysiajs/swagger";
import { spawnSync } from "bun";
import { randomBytes } from "crypto";
import { Elysia } from "elysia";
import pretty from "pino-pretty";

// Shared Infrastructure
import { healthRoutes } from "./src/shared/application/common/health.routes";
import { db } from "./src/shared/infrastructure/database/connection";
import { initializeSentry } from "./src/shared/infrastructure/monitoring/sentry.config";

// Domain Routes
import { productRoutes } from "./src/domains/catalog/presentation/routes/products.routes";
import { contentRoutes } from "./src/domains/content/presentation/routes/content.routes";
import { guestRoutes } from "./src/domains/content/presentation/routes/guest.routes";
import { authRoutes } from "./src/domains/identity/presentation/routes/auth.routes";
import { invoicesRoutes } from "./src/domains/order/presentation/routes/invoices.routes";
import { ordersRoutes } from "./src/domains/order/presentation/routes/orders.routes";
import { stripeWebhookRoutes } from "./src/domains/payment/presentation/routes/stripe-webhook.routes";
import { cartRoutes } from "./src/domains/shopping/presentation/routes/cart.routes";
import { favoritesRoutes } from "./src/domains/shopping/presentation/routes/favorites.routes";
import { addressRoutes } from "./src/domains/user/presentation/routes/address.routes";
import { profileRoutes } from "./src/domains/user/presentation/routes/profile.routes";
import { utilsRoutes } from "./src/shared/application/common/utils.routes";

// Initialize Sentry monitoring
initializeSentry();

const stream = pretty({
  colorize: true,
  translateTime: "SYS:standard",
});

// Root endpoint'te göstermek için git commit hash'ini al
const getGitCommitHash = () => {
  try {
    const { stdout } = spawnSync(["git", "rev-parse", "HEAD"]);
    return stdout.toString().trim();
  } catch (e) {
    return "unknown";
  }
};
const commitHash = getGitCommitHash();

export const app = new Elysia()
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
            url: "http://localhost:3000",
            description: "Development server",
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
      (context.store as any).rootReqStartTime = process.hrtime.bigint();
    },
    afterHandle({ response, store }) {
      const { rootReqStartTime } = store as { rootReqStartTime: bigint };
      const duration = process.hrtime.bigint() - rootReqStartTime;
      const durationInMs = Number(duration) / 1_000_000;
      const requestId = randomBytes(8).toString("hex");

      if (typeof response === "string") {
        return `${response} From ${commitHash} (${requestId}) in ${durationInMs.toPrecision(15)}ms.`;
      }
      return response;
    },
  })
  .group("/api", (app) =>
    app
      // Identity Domain
      .use(authRoutes)

      // User Domain (grouped under /users prefix)
      .group("/users", (userApp) =>
        userApp
          .use(profileRoutes)
          .use(addressRoutes)
          .use(favoritesRoutes)
      )
      
      // Cart routes (directly under /api for /me/cart)
      .use(cartRoutes)

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
  console.log(`📱 Mobile app can connect to: http://172.20.10.2:3000`);
}

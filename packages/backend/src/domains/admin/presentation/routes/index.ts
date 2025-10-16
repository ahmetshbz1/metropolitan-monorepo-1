import { Elysia } from "elysia";

import { adminAISettingsRoutes } from "./ai-settings.routes";
import { adminAuthRoutes } from "./auth.routes";
import { adminCartsRoutes } from "./carts.routes";
import { adminCategoriesRoutes } from "./categories.routes";
import { adminCompaniesRoutes } from "./companies.routes";
import { adminDashboardRoutes } from "./dashboard.routes";
import { adminOrdersRoutes } from "./orders.routes";
import { adminProductsRoutes } from "./products.routes";
import { adminPushNotificationsRoutes } from "./push-notifications.routes";
import { adminUsersRoutes } from "./users.routes";

export const adminRoutes = new Elysia()
  .use(adminAuthRoutes)
  .use(adminAISettingsRoutes)
  .use(adminCartsRoutes)
  .use(adminCategoriesRoutes)
  .use(adminCompaniesRoutes)
  .use(adminDashboardRoutes)
  .use(adminOrdersRoutes)
  .use(adminProductsRoutes)
  .use(adminPushNotificationsRoutes)
  .use(adminUsersRoutes);

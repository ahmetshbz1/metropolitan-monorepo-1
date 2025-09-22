//  "orders.routes.ts"
//  metropolitan backend
//  Main order routes orchestrator - delegates to feature-specific routes
//  Refactored for better modularity

import { Elysia } from "elysia";

import { orderCreationRoutes } from "./order-creation.routes";
import { orderManagementRoutes } from "./order-management.routes";
import { orderQueryRoutes } from "./order-query.routes";

/**
 * Create modular orders application by composing feature-specific routes
 */
export const createOrdersApp = () =>
  new Elysia({ prefix: "/orders" })
    // Order creation endpoints
    .use(orderCreationRoutes)
    // Order query and tracking endpoints
    .use(orderQueryRoutes)
    // Order management endpoints (cancel, update)
    .use(orderManagementRoutes);

export const ordersRoutes = createOrdersApp();

// Export feature-specific routes for testing or direct usage
export { orderCreationRoutes, orderQueryRoutes, orderManagementRoutes };
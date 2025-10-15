//  "products.routes.ts"
//  metropolitan backend
//  Created by Ahmet on 22.06.2025.

import { productsAuthMiddleware } from "./products-auth";
import { productsCategoriesRoutes } from "./products-categories.routes";
import { productsDetailRoutes } from "./products-detail.routes";
import { productsListRoutes } from "./products-list.routes";
import { productsSearchRoutes } from "./products-search.routes";

/**
 * Main products routes orchestrator
 * - Applies JWT auth middleware to all routes
 * - Groups all endpoints under /products
 * - Composes modular route files
 */
export const productRoutes = productsAuthMiddleware
  .group("/products", (app) =>
    app
      .use(productsSearchRoutes)
      .use(productsCategoriesRoutes)
      .use(productsListRoutes)
      .use(productsDetailRoutes)
  );

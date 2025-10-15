//  "products.routes.ts"
//  metropolitan backend
//  Admin ürün yönetimi ana orchestrator

import { createAdminRouter } from "./admin-router.factory";
import { productCreateRoutes } from "./product-create.routes";
import { productDeleteRoutes } from "./product-delete.routes";
import { productImageRoutes } from "./product-image.routes";
import { productListRoutes } from "./product-list.routes";
import { productUpdateRoutes } from "./product-update.routes";

export const adminProductsRoutes = createAdminRouter("/admin/products")
  .use(productListRoutes)
  .use(productCreateRoutes)
  .use(productImageRoutes)
  .use(productUpdateRoutes)
  .use(productDeleteRoutes);

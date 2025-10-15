//  "product-delete.routes.ts"
//  metropolitan backend
//  Ürün silme rotaları

import { t } from "elysia";

import { AdminDeleteProductService } from "../../application/use-cases/products/delete-product.service";

import { createAdminRouter } from "./admin-router.factory";

export const productDeleteRoutes = createAdminRouter().delete(
  "/:id",
  async ({ params, set }) => {
    try {
      const result = await AdminDeleteProductService.execute(params.id);
      return result;
    } catch (error) {
      set.status = 400;
      return {
        success: false,
        message: error instanceof Error ? error.message : "Ürün silinemedi",
      };
    }
  },
  {
    params: t.Object({ id: t.String({ format: "uuid" }) }),
  }
);

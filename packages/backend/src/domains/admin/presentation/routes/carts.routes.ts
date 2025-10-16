import { t } from "elysia";

import { GetAllCartsService } from "../../application/use-cases/carts/get-all-carts.service";
import { GetUserCartService } from "../../application/use-cases/carts/get-user-cart.service";

import { createAdminRouter } from "./admin-router.factory";

export const adminCartsRoutes = createAdminRouter("/admin/carts")
  .get("/", async ({ query, set }) => {
    try {
      const filters = {
        search: query?.search as string | undefined,
        userType: query?.userType as string | undefined,
        abandonedOnly: query?.abandonedOnly === "true",
        abandonedDays: query?.abandonedDays
          ? Number(query.abandonedDays)
          : undefined,
        limit: query?.limit ? Number(query.limit) : undefined,
        offset: query?.offset ? Number(query.offset) : undefined,
      };

      const result = await GetAllCartsService.execute(filters);
      return result;
    } catch (error) {
      console.error("Admin carts error:", error);
      set.status = 400;
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Sepetler getirilemedi",
      };
    }
  })
  .get(
    "/user/:userId",
    async ({ params, set }) => {
      try {
        const result = await GetUserCartService.execute(params.userId);
        return result;
      } catch (error) {
        console.error("Admin user cart error:", error);
        set.status = 400;
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Kullanıcı sepeti getirilemedi",
        };
      }
    },
    {
      params: t.Object({ userId: t.String({ format: "uuid" }) }),
    }
  );

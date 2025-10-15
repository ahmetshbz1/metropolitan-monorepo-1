import { logger } from "../../../../shared/infrastructure/monitoring/logger.config";
import { getDashboardStatsService } from "../../application/use-cases/dashboard/get-dashboard-stats.service";

import { createAdminRouter } from "./admin-router.factory";

export const adminDashboardRoutes = createAdminRouter("/admin/dashboard").get(
  "/stats",
  async ({ set }) => {
    try {
      const stats = await getDashboardStatsService();
      return stats;
    } catch (error) {
      logger.error({ error, context: "AdminDashboardRoutes" }, "Dashboard stats error");
      set.status = 500;
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Dashboard yüklenemedi",
      };
    }
  }
);

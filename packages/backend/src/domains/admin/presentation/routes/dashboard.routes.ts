import { createApp } from "../../../../shared/infrastructure/web/app";
import { isAdminAuthenticated } from "../../application/guards/admin.guard";
import { getDashboardStatsService } from "../../application/use-cases/dashboard/get-dashboard-stats.service";

export const adminDashboardRoutes = createApp()
  .use(isAdminAuthenticated)
  .group("/admin/dashboard", (app) =>
    app.get("/stats", async ({ set }) => {
      try {
        const stats = await getDashboardStatsService();
        return stats;
      } catch (error) {
        console.error("Dashboard stats error:", error);
        set.status = 500;
        return {
          success: false,
          message: error instanceof Error ? error.message : "Dashboard yüklenemedi",
        };
      }
    })
  );

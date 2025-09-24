// "cleanup.routes.ts"
// metropolitan backend
// Cleanup routes for scheduled tasks

import { logger } from "@bogeychan/elysia-logger";
import { createApp } from "../../../../shared/infrastructure/web/app";
import { cleanupDeletedAccounts } from "../../application/use-cases/cleanup-deleted-accounts";

export const cleanupRoutes = createApp()
  .use(logger({ level: "info" }))
  .group("/admin/cleanup", (app) =>
    app
      // Cleanup deleted accounts endpoint (should be called by cron job)
      .post(
        "/deleted-accounts",
        async ({ log, headers }) => {
          // Simple security: require a secret header
          const cleanupSecret = process.env.CLEANUP_SECRET;
          if (cleanupSecret && headers["x-cleanup-secret"] !== cleanupSecret) {
            return { success: false, message: "Unauthorized" };
          }

          try {
            await cleanupDeletedAccounts();
            log.info("Deleted accounts cleanup completed successfully");
            return { success: true, message: "Cleanup completed successfully" };
          } catch (error) {
            log.error("Error during cleanup", error);
            return { success: false, message: "Cleanup failed" };
          }
        }
      )
  );
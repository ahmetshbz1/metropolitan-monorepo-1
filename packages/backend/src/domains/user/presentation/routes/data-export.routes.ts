// "data-export.routes.ts"
// metropolitan backend
// User data export routes (GDPR compliance)

import { logger } from "@bogeychan/elysia-logger";
import { t } from "elysia";
import * as fs from "fs";
import * as path from "path";
import { createApp } from "../../../../shared/infrastructure/web/app";
import { authTokenGuard } from "../../../identity/presentation/routes/auth-guards";
import { DataExportService } from "../../application/use-cases/data-export.service";

export const dataExportRoutes = createApp()
  .use(logger({ level: "info" }))
  .use(authTokenGuard)
  // Request data export
  .post(
    "/export-data",
    async ({ body, profile, log }) => {
      if (!profile?.userId) {
        return { success: false, message: "Unauthorized" };
      }

      try {
        const result = await DataExportService.exportUserData(
          profile.userId,
          body.method
        );

        log.info(
          { userId: profile.userId, method: body.method },
          `Data export requested`
        );

        return {
          success: true,
          message:
            body.method === "email"
              ? "Export request sent to email"
              : "Export file generated",
          ...(body.method === "download" && {
            downloadUrl: result.downloadUrl,
            password: result.password,
          }),
        };
      } catch (error) {
        log.error(
          { userId: profile.userId, error: error.message },
          `Data export failed`
        );
        return {
          success: false,
          message: "Failed to export data",
        };
      }
    },
    {
      body: t.Object({
        method: t.Union([t.Literal("email"), t.Literal("download")]),
      }),
    }
  )

  // Get export status
  .get(
    "/export-status/:requestId",
    async ({ params, profile, log }) => {
      if (!profile?.userId) {
        return { success: false, message: "Unauthorized" };
      }

      try {
        const status = await DataExportService.getExportStatus(
          params.requestId,
          profile.userId
        );

        return {
          success: true,
          status: status.status,
          downloadUrl: status.downloadUrl,
          expiresAt: status.expiresAt,
        };
      } catch (error) {
        log.error(
          {
            userId: profile.userId,
            requestId: params.requestId,
            error: error.message,
          },
          `Failed to get export status`
        );
        return {
          success: false,
          message: "Failed to get export status",
        };
      }
    },
    {
      params: t.Object({
        requestId: t.String(),
      }),
    }
  )

  // Download export file
  .get(
    "/download-export/:fileName",
    async ({ params, query, profile, log, set }) => {
      if (!profile?.userId) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
      }

      try {
        const { fileName } = params;
        const { token } = query;

        // Validate token and file ownership
        if (!token || !fileName) {
          set.status = 400;
          return { success: false, message: "Invalid request" };
        }

        const filePath = path.join(
          process.cwd(),
          "uploads",
          "exports",
          fileName
        );

        // Check if file exists
        if (!fs.existsSync(filePath)) {
          set.status = 404;
          return { success: false, message: "File not found" };
        }

        // Read and return file
        const fileContent = fs.readFileSync(filePath);

        set.headers["Content-Type"] = "application/json";
        set.headers["Content-Disposition"] =
          `attachment; filename="${fileName}"`;

        log.info(
          { userId: profile.userId, fileName },
          `File downloaded successfully`
        );

        return fileContent;
      } catch (error) {
        log.error(
          { userId: profile.userId, error: error.message },
          `File download failed`
        );
        set.status = 500;
        return { success: false, message: "Download failed" };
      }
    },
    {
      params: t.Object({
        fileName: t.String(),
      }),
      query: t.Object({
        token: t.String(),
      }),
    }
  );

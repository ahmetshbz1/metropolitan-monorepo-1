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
      // Extract userId from JWT structure
      const userId = profile?.sub || profile?.userId;
      if (!profile || !userId) {
        return { success: false, message: "Unauthorized" };
      }

      try {
        const result = await DataExportService.exportUserData(
          userId,
          body.method
        );

        log.info(
          { userId: userId, method: body.method },
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
          { userId: userId, error: error.message },
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
      // Extract userId from JWT structure
      const userId = profile?.sub || profile?.userId;
      if (!profile || !userId) {
        return { success: false, message: "Unauthorized" };
      }

      try {
        const status = await DataExportService.getExportStatus(
          params.requestId,
          userId
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
            userId: userId,
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
      // Extract userId from JWT structure
      const userId = profile?.sub || profile?.userId;
      if (!profile || !userId) {
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

        // SECURITY: Check if file belongs to authenticated user
        if (!fileName.includes(userId)) {
          log.warn(
            { userId: userId, fileName, attemptedAccess: true },
            `Unauthorized file access attempt`
          );
          set.status = 403;
          return { success: false, message: "Access denied" };
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
          { userId: userId, fileName },
          `File downloaded successfully`
        );

        return fileContent;
      } catch (error) {
        log.error(
          { userId: userId, error: error.message },
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
  )

  // Extract and view ZIP contents
  .post(
    "/view-export/:fileName",
    async ({ params, body, profile, log, set }) => {
      // Extract userId from JWT structure
      const userId = profile?.sub || profile?.userId;
      if (!profile || !userId) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
      }

      try {
        const { fileName } = params;
        const { password, token } = body;

        // Validate inputs
        if (!token || !fileName || !password) {
          set.status = 400;
          return { success: false, message: "Invalid request" };
        }

        // SECURITY: Check if file belongs to authenticated user
        if (!fileName.includes(userId)) {
          log.warn(
            { userId: userId, fileName, attemptedAccess: true },
            `Unauthorized file access attempt`
          );
          set.status = 403;
          return { success: false, message: "Access denied" };
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

        // Extract ZIP with password
        const tempDir = path.join(
          process.cwd(),
          "uploads",
          "temp",
          `extract_${Date.now()}`
        );

        try {
          // Create temp directory
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
          }

          // Extract ZIP with system unzip command
          const { exec } = require("child_process");
          const { promisify } = require("util");
          const execAsync = promisify(exec);
          const command = `unzip -P ${password} "${filePath}" -d "${tempDir}"`;

          await execAsync(command);

          // Read extracted files
          const files = fs.readdirSync(tempDir);
          const fileContents: any[] = [];

          for (const file of files) {
            const extractedFilePath = path.join(tempDir, file);
            const stats = fs.statSync(extractedFilePath);

            let content = null;
            if (file.endsWith(".json") && stats.size < 1024 * 1024) {
              // Max 1MB
              content = JSON.parse(fs.readFileSync(extractedFilePath, "utf8"));
            }

            fileContents.push({
              name: file,
              size: stats.size,
              content: content,
              type: file.split(".").pop() || "unknown",
            });
          }

          log.info(
            { userId: userId, fileName, filesExtracted: files.length },
            `ZIP contents extracted successfully`
          );

          return {
            success: true,
            files: fileContents,
            totalFiles: files.length,
          };
        } catch (extractError) {
          log.warn(
            { userId: userId, fileName, error: extractError.message },
            `ZIP extraction failed - likely wrong password`
          );
          set.status = 400;
          return {
            success: false,
            message: "Wrong password or corrupted file",
          };
        } finally {
          // Clean up temp directory
          if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
          }
        }
      } catch (error) {
        log.error(
          { userId: userId, error: error.message },
          `ZIP view failed`
        );
        set.status = 500;
        return { success: false, message: "Failed to extract ZIP" };
      }
    },
    {
      params: t.Object({
        fileName: t.String(),
      }),
      body: t.Object({
        password: t.String(),
        token: t.String(),
      }),
    }
  );

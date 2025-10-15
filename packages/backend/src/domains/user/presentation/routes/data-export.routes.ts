// "data-export.routes.ts"
// metropolitan backend
// User data export routes (GDPR compliance)

import { logger } from "@bogeychan/elysia-logger";

import { createApp } from "../../../../shared/infrastructure/web/app";
import { authTokenGuard } from "../../../identity/presentation/routes/auth-guards";
import {
  handleDownloadExport,
  handleExportRequest,
  handleExportStatus,
  handleViewExport,
} from "./data-export-handlers";
import {
  downloadQuerySchema,
  exportRequestSchema,
  exportStatusParamsSchema,
  fileParamsSchema,
  viewExportSchema,
} from "./data-export-types";

export const dataExportRoutes = createApp()
  .use(logger({ level: "info" }))
  .use(authTokenGuard)
  // Request data export
  .post("/export-data", handleExportRequest, {
    body: exportRequestSchema,
  })
  // Get export status
  .get("/export-status/:requestId", handleExportStatus, {
    params: exportStatusParamsSchema,
  })
  // Download export file
  .get("/download-export/:fileName", handleDownloadExport, {
    params: fileParamsSchema,
    query: downloadQuerySchema,
  })
  // Extract and view ZIP contents
  .post("/view-export/:fileName", handleViewExport, viewExportSchema);

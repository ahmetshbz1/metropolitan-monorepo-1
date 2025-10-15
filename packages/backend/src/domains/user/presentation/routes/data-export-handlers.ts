// "data-export-handlers.ts"
// metropolitan backend
// Business logic handlers for data export endpoints

import * as fs from "fs";
import * as path from "path";

import type { Context } from "elysia";

import { DataExportService } from "../../application/use-cases/data-export.service";
import { validateAuth } from "./data-export-auth";
import {
  validateFileExists,
  validateFileOwnership,
  validateRequestParams,
  validateViewExportParams,
} from "./data-export-security";
import type {
  DownloadQuery,
  ExportRequestBody,
  ExportStatusParams,
  ExtractedFile,
  FileParams,
  ViewExportBody,
} from "./data-export-types";

/**
 * Data export request handler
 * Email veya download metodu ile kullanıcı verilerini dışa aktarır
 */
export async function handleExportRequest(
  context: Context & {
    body: ExportRequestBody;
    profile: { sub?: string; userId?: string } | undefined;
  }
) {
  const { body, profile, log } = context;

  const auth = validateAuth(profile);
  if (!auth.isValid || !auth.userId) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const result = await DataExportService.exportUserData(
      auth.userId,
      body.method
    );

    log.info({ userId: auth.userId, method: body.method }, `Data export requested`);

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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    log.error({ userId: auth.userId, error: message }, `Data export failed`);
    return {
      success: false,
      message: "Failed to export data",
    };
  }
}

/**
 * Export status query handler
 * Dışa aktarma işleminin durumunu sorgular
 */
export async function handleExportStatus(
  context: Context & {
    params: ExportStatusParams;
    profile: { sub?: string; userId?: string } | undefined;
  }
) {
  const { params, profile, log } = context;

  const auth = validateAuth(profile);
  if (!auth.isValid || !auth.userId) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const status = await DataExportService.getExportStatus(
      params.requestId,
      auth.userId
    );

    return {
      success: true,
      status: status.status,
      downloadUrl: status.downloadUrl,
      expiresAt: status.expiresAt,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    log.error(
      {
        userId: auth.userId,
        requestId: params.requestId,
        error: message,
      },
      `Failed to get export status`
    );
    return {
      success: false,
      message: "Failed to get export status",
    };
  }
}

/**
 * Export file download handler
 * Oluşturulan export dosyasını indirir
 */
export async function handleDownloadExport(
  context: Context & {
    params: FileParams;
    query: DownloadQuery;
    profile: { sub?: string; userId?: string } | undefined;
  }
) {
  const { params, query, profile, log, set } = context;

  const auth = validateAuth(profile);
  if (!auth.isValid || !auth.userId) {
    set.status = 401;
    return { success: false, message: "Unauthorized" };
  }

  try {
    const { fileName } = params;
    const { token } = query;

    // Validate token and file ownership
    if (!validateRequestParams(token, fileName)) {
      set.status = 400;
      return { success: false, message: "Invalid request" };
    }

    // SECURITY: Check if file belongs to authenticated user
    const ownershipCheck = validateFileOwnership(fileName, auth.userId);
    if (!ownershipCheck.isValid) {
      log.warn(
        { userId: auth.userId, fileName, attemptedAccess: true },
        `Unauthorized file access attempt`
      );
      set.status = 403;
      return { success: false, message: "Access denied" };
    }

    // Check if file exists
    const fileCheck = validateFileExists(fileName);
    if (!fileCheck.isValid || !fileCheck.filePath) {
      set.status = 404;
      return { success: false, message: "File not found" };
    }

    // Read and return file
    const fileContent = fs.readFileSync(fileCheck.filePath);

    set.headers["Content-Type"] = "application/json";
    set.headers["Content-Disposition"] = `attachment; filename="${fileName}"`;

    log.info({ userId: auth.userId, fileName }, `File downloaded successfully`);

    return fileContent;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    log.error({ userId: auth.userId, error: message }, `File download failed`);
    set.status = 500;
    return { success: false, message: "Download failed" };
  }
}

/**
 * View export ZIP contents handler
 * ZIP dosyasını açar ve içeriğini görüntüler
 */
export async function handleViewExport(
  context: Context & {
    params: FileParams;
    body: ViewExportBody;
    profile: { sub?: string; userId?: string } | undefined;
  }
) {
  const { params, body, profile, log, set } = context;

  const auth = validateAuth(profile);
  if (!auth.isValid || !auth.userId) {
    set.status = 401;
    return { success: false, message: "Unauthorized" };
  }

  try {
    const { fileName } = params;
    const { password, token } = body;

    // Validate inputs
    if (!validateViewExportParams(token, fileName, password)) {
      set.status = 400;
      return { success: false, message: "Invalid request" };
    }

    // SECURITY: Check if file belongs to authenticated user
    const ownershipCheck = validateFileOwnership(fileName, auth.userId);
    if (!ownershipCheck.isValid) {
      log.warn(
        { userId: auth.userId, fileName, attemptedAccess: true },
        `Unauthorized file access attempt`
      );
      set.status = 403;
      return { success: false, message: "Access denied" };
    }

    // Check if file exists
    const fileCheck = validateFileExists(fileName);
    if (!fileCheck.isValid || !fileCheck.filePath) {
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
      const command = `unzip -P ${password} "${fileCheck.filePath}" -d "${tempDir}"`;

      await execAsync(command);

      // Read extracted files
      const files = fs.readdirSync(tempDir);
      const fileContents: ExtractedFile[] = [];

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
        { userId: auth.userId, fileName, filesExtracted: files.length },
        `ZIP contents extracted successfully`
      );

      return {
        success: true,
        files: fileContents,
        totalFiles: files.length,
      };
    } catch (extractError: unknown) {
      const extractMessage =
        extractError instanceof Error ? extractError.message : "Unknown error";

      log.warn(
        { userId: auth.userId, fileName, error: extractMessage },
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
      {
        userId: auth.userId,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      `ZIP view failed`
    );
    set.status = 500;
    return { success: false, message: "Failed to extract ZIP" };
  }
}

// "data-export-types.ts"
// metropolitan backend
// Data export type definitions ve validation schemas

import { t } from "elysia";

// Request/Response Type Definitions
export interface ExportRequestBody {
  method: "email" | "download";
}

export interface ExportStatusParams {
  requestId: string;
}

export interface FileParams {
  fileName: string;
}

export interface DownloadQuery {
  token: string;
}

export interface ViewExportBody {
  password: string;
  token: string;
}

export interface ExtractedFile {
  name: string;
  size: number;
  content: unknown;
  type: string;
}

// Validation Schemas
export const exportRequestSchema = t.Object({
  method: t.Union([t.Literal("email"), t.Literal("download")]),
});

export const exportStatusParamsSchema = t.Object({
  requestId: t.String(),
});

export const fileParamsSchema = t.Object({
  fileName: t.String(),
});

export const downloadQuerySchema = t.Object({
  token: t.String(),
});

export const viewExportSchema = {
  params: t.Object({
    fileName: t.String(),
  }),
  body: t.Object({
    password: t.String(),
    token: t.String(),
  }),
};

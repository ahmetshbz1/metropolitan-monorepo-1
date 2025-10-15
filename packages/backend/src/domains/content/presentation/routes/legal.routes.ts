//  "legal.routes.ts"
//  metropolitan backend
//  Created by Ahmet on 30.09.2025.

import { readFile } from "fs/promises";
import { join } from "path";

import { t } from "elysia";

import { logger } from "../../../../shared/infrastructure/monitoring/logger.config";
import { createApp } from "../../../../shared/infrastructure/web/app";

const LEGAL_TYPES = ["privacy-policy", "cookie-policy", "terms-of-service"] as const;
const LANGUAGES = ["tr", "en", "pl"] as const;

type LegalType = (typeof LEGAL_TYPES)[number];
type Language = (typeof LANGUAGES)[number];

const isNodeError = (error: unknown): error is NodeJS.ErrnoException =>
  typeof error === "object" && error !== null && "code" in error;

export const legalRoutes = createApp().group("/legal", (app) =>
  app.get(
    "/:type",
    async ({ params, query, set }) => {
      const { type } = params;
      const lang = (query.lang || "en") as Language;

      // Validate type
      if (!LEGAL_TYPES.includes(type as LegalType)) {
        set.status = 400;
        return {
          success: false,
          message: `Invalid legal document type. Must be one of: ${LEGAL_TYPES.join(", ")}`,
        };
      }

      // Validate language
      if (!LANGUAGES.includes(lang)) {
        set.status = 400;
        return {
          success: false,
          message: `Invalid language. Must be one of: ${LANGUAGES.join(", ")}`,
        };
      }

      try {
        const filePath = join(
          process.cwd(),
          "public",
          "legal",
          `${type}-${lang}.md`
        );

        const content = await readFile(filePath, "utf-8");

        return {
          success: true,
          data: {
            type,
            language: lang,
            content,
          },
        };
      } catch (error: unknown) {
        if (isNodeError(error) && error.code === "ENOENT") {
          set.status = 404;
          return {
            success: false,
            message: `Legal document not found: ${type} (${lang})`,
          };
        }

        logger.error({ error, type, lang }, "Error reading legal document");
        set.status = 500;
        return {
          success: false,
          message: "Failed to load legal document",
        };
      }
    },
    {
      params: t.Object({
        type: t.Union([
          t.Literal("privacy-policy"),
          t.Literal("cookie-policy"),
          t.Literal("terms-of-service"),
        ]),
      }),
      query: t.Object({
        lang: t.Optional(
          t.Union([t.Literal("tr"), t.Literal("en"), t.Literal("pl")])
        ),
      }),
    }
  )
);
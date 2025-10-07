import { t } from "elysia";

import { createApp } from "../../../../shared/infrastructure/web/app";
import { isAdminAuthenticated } from "../../application/guards/admin.guard";
import { GetAISettingsService } from "../../application/use-cases/ai-settings/get-ai-settings.service";
import { GetAvailableModelsService } from "../../application/use-cases/ai-settings/get-available-models.service";
import { UpdateAISettingsService } from "../../application/use-cases/ai-settings/update-ai-settings.service";

const updateAISettingsSchema = t.Object({
  provider: t.String({ enum: ["gemini", "openai"] }),
  apiKey: t.String({ minLength: 1 }),
  model: t.String({ minLength: 1 }),
});

export const adminAISettingsRoutes = createApp()
  .use(isAdminAuthenticated)
  .group("/admin/ai-settings", (app) =>
    app
      .get("/models", async ({ set }) => {
        try {
          const result = await GetAvailableModelsService.execute();
          return result;
        } catch (error) {
          set.status = 400;
          return {
            success: false,
            message:
              error instanceof Error ? error.message : "Modeller getirilemedi",
          };
        }
      })
      .get("/", async ({ set }) => {
        try {
          const result = await GetAISettingsService.execute();
          return result;
        } catch (error) {
          set.status = 400;
          return {
            success: false,
            message:
              error instanceof Error ? error.message : "AI ayarları getirilemedi",
          };
        }
      })
      .put(
        "/",
        async ({ body, set }) => {
          try {
            const result = await UpdateAISettingsService.execute(body);
            return result;
          } catch (error) {
            set.status = 400;
            return {
              success: false,
              message:
                error instanceof Error
                  ? error.message
                  : "AI ayarları güncellenemedi",
            };
          }
        },
        {
          body: updateAISettingsSchema,
        }
      )
  );

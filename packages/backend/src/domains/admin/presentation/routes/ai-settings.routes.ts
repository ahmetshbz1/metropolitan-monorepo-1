import { t } from "elysia";

import { GetAISettingsService } from "../../application/use-cases/ai-settings/get-ai-settings.service";
import { GetAvailableModelsService } from "../../application/use-cases/ai-settings/get-available-models.service";
import { UpdateAISettingsService } from "../../application/use-cases/ai-settings/update-ai-settings.service";

import { createAdminRouter } from "./admin-router.factory";

const updateAISettingsSchema = t.Object({
  provider: t.String({ enum: ["gemini", "openai"] }),
  apiKey: t.String({ minLength: 1 }),
  model: t.String({ minLength: 1 }),
});

export const adminAISettingsRoutes = createAdminRouter("/admin/ai-settings")
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
  );

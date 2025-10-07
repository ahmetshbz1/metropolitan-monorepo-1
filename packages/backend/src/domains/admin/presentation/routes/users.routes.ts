import { createApp } from "../../../../shared/infrastructure/web/app";
import { isAdminAuthenticated } from "../../application/guards/admin.guard";
import { GetAdminUsersService } from "../../application/use-cases/users/get-users.service";

export const adminUsersRoutes = createApp()
  .use(isAdminAuthenticated)
  .group("/admin/users", (app) =>
    app.get("/", async ({ query, set }) => {
      try {
        const filters = {
          userType: query?.userType as string | undefined,
          search: query?.search as string | undefined,
          limit: query?.limit ? Number(query.limit) : undefined,
          offset: query?.offset ? Number(query.offset) : undefined,
        };

        const result = await GetAdminUsersService.execute(filters);
        return result;
      } catch (error) {
        console.error("Admin users error:", error);
        set.status = 400;
        return {
          success: false,
          message: error instanceof Error ? error.message : "Kullanıcılar getirilemedi",
        };
      }
    })
  );

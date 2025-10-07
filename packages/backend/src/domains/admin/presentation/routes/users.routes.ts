import { t } from "elysia";

import { createApp } from "../../../../shared/infrastructure/web/app";
import { isAdminAuthenticated } from "../../application/guards/admin.guard";
import { GetAdminUsersService } from "../../application/use-cases/users/get-users.service";
import { UpdateUserService } from "../../application/use-cases/users/update-user.service";
import { DeleteUserService } from "../../application/use-cases/users/delete-user.service";

const updateUserSchema = t.Object({
  phoneNumber: t.Optional(t.String()),
  phoneNumberVerified: t.Optional(t.Boolean()),
  firstName: t.Optional(t.Union([t.String(), t.Null()])),
  lastName: t.Optional(t.Union([t.String(), t.Null()])),
  email: t.Optional(t.Union([t.String(), t.Null()])),
  userType: t.Optional(t.String({ enum: ["individual", "corporate"] })),
  companyId: t.Optional(t.Union([t.String({ format: "uuid" }), t.Null()])),
  profilePhotoUrl: t.Optional(t.Union([t.String(), t.Null()])),
  marketingConsent: t.Optional(t.Boolean()),
  shareDataWithPartners: t.Optional(t.Boolean()),
  analyticsData: t.Optional(t.Boolean()),
  smsNotifications: t.Optional(t.Boolean()),
  pushNotifications: t.Optional(t.Boolean()),
  emailNotifications: t.Optional(t.Boolean()),
});

export const adminUsersRoutes = createApp()
  .use(isAdminAuthenticated)
  .group("/admin/users", (app) =>
    app
      .get("/", async ({ query, set }) => {
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
      .patch(
        "/:id",
        async ({ params, body, set }) => {
          try {
            const result = await UpdateUserService.execute({
              userId: params.id,
              ...body,
            });
            return result;
          } catch (error) {
            set.status = 400;
            return {
              success: false,
              message: error instanceof Error ? error.message : "Kullanıcı güncellenemedi",
            };
          }
        },
        {
          params: t.Object({ id: t.String({ format: "uuid" }) }),
          body: updateUserSchema,
        }
      )
      .delete(
        "/:id",
        async ({ params, set }) => {
          try {
            const result = await DeleteUserService.execute(params.id);
            return result;
          } catch (error) {
            set.status = 400;
            return {
              success: false,
              message: error instanceof Error ? error.message : "Kullanıcı silinemedi",
            };
          }
        },
        {
          params: t.Object({ id: t.String({ format: "uuid" }) }),
        }
      )
  );

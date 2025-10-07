import { t } from "elysia";

import { createApp } from "../../../../shared/infrastructure/web/app";
import { isAdminAuthenticated } from "../../application/guards/admin.guard";
import { GetCompaniesService } from "../../application/use-cases/companies/get-companies.service";
import { UpdateCompanyService } from "../../application/use-cases/companies/update-company.service";

const updateCompanySchema = t.Object({
  name: t.String(),
  nip: t.String(),
});

export const adminCompaniesRoutes = createApp()
  .use(isAdminAuthenticated)
  .group("/admin/companies", (app) =>
    app
      .get("/", async ({ set }) => {
        try {
          const companies = await GetCompaniesService.execute();
          return { companies };
        } catch (error) {
          console.error("Admin companies error:", error);
          set.status = 400;
          return {
            success: false,
            message: error instanceof Error ? error.message : "Şirketler getirilemedi",
          };
        }
      })
      .patch(
        "/:id",
        async ({ params, body, set }) => {
          try {
            const result = await UpdateCompanyService.execute({
              companyId: params.id,
              ...body,
            });
            return result;
          } catch (error) {
            set.status = 400;
            return {
              success: false,
              message: error instanceof Error ? error.message : "Şirket güncellenemedi",
            };
          }
        },
        {
          params: t.Object({ id: t.String({ format: "uuid" }) }),
          body: updateCompanySchema,
        }
      )
  );

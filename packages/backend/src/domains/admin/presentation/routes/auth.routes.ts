//  "auth.routes.ts"
//  metropolitan backend
//  Admin giriş işlemleri

import { t } from "elysia";

import { createApp } from "../../../../shared/infrastructure/web/app";
import { AdminAuthService, AdminAuthError } from "../../application/use-cases/auth/admin-auth.service";

const adminAuthService = new AdminAuthService();

export const adminAuthRoutes = createApp().group("/admin", (app) =>
  app.post(
    "/auth/login",
    async ({ body, jwt, set }) => {
      try {
        const result = await adminAuthService.login(
          body.email,
          body.password,
          jwt
        );

        return result;
      } catch (error) {
        if (error instanceof AdminAuthError) {
          set.status = error.status;
          return { success: false, message: error.message };
        }

        console.error("Admin giriş hatası", error);
        set.status = 500;
        return {
          success: false,
          message: "Giriş işlemi gerçekleştirilemedi",
        };
      }
    },
    {
      detail: {
        tags: ["Admin"],
        summary: "Admin kullanıcısı için giriş işlemi",
        description: "Admin paneline erişim için e-posta ve parola ile kimlik doğrulama",
      },
      body: t.Object({
        email: t.String({
          format: "email",
          error: "Geçerli bir e-posta adresi giriniz",
        }),
        password: t.String({
          minLength: 12,
          maxLength: 128,
          error: "Parola minimum 12 karakter olmalıdır",
        }),
      }),
    }
  )
);

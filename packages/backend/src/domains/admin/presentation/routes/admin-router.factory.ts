import { Elysia } from "elysia";

import { isAdminAuthenticated } from "../../application/guards/admin.guard";

interface CreateAdminRouterOptions {
  skipAuth?: boolean;
}

export const createAdminRouter = (
  prefix: string,
  options?: CreateAdminRouterOptions
) => {
  const app = new Elysia({ prefix });

  if (!options?.skipAuth) {
    app.use(isAdminAuthenticated);
  }

  return app;
};

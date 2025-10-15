// change-phone.routes.ts
// Main orchestrator for phone change endpoints - composes all route modules

import { logger } from "@bogeychan/elysia-logger";

import { createApp } from "../../../../shared/infrastructure/web/app";

import { authTokenGuard } from "./auth-guards";
import { changePhoneCurrentRoutes } from "./change-phone-current.routes";
import { changePhoneOtpRoutes } from "./change-phone-otp.routes";
import { changePhoneVerificationRoutes } from "./change-phone-verification.routes";

export const changePhoneRoutes = createApp()
  .use(logger({ level: "info" }))
  .use(authTokenGuard)
  .group("/auth/change-phone", (app) =>
    app
      .use(changePhoneCurrentRoutes)
      .use(changePhoneOtpRoutes)
      .use(changePhoneVerificationRoutes)
  );

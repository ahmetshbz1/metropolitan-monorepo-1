//  "auth.routes.ts"
//  metropolitan backend
//  Created by Ahmet on 25.06.2025.
//  Refactored to use modular route structure

import { createApp } from "../../../../shared/infrastructure/web/app";

import { guestMigrationRoutes } from "./guest-migration.routes";
import { logoutRoutes } from "./logout.routes";
import { otpRoutes } from "./otp.routes";

/**
 * Authentication routes coordinator
 * Combines all auth-related route modules
 */
export const authRoutes = createApp()
  // Mount OTP routes (send-otp, verify-otp)
  .use(otpRoutes)
  // Mount guest data migration routes
  .use(guestMigrationRoutes)
  // Mount logout routes (includes auth guard)
  .use(logoutRoutes);

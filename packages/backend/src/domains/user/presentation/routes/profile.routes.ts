//  "profile.routes.ts"
//  metropolitan backend
//  Created by Ahmet on 14.06.2025.
//  Main orchestrator for all profile-related routes

import { createApp } from "../../../../shared/infrastructure/web/app";
import { profileCompletionRoutes } from "./profile-completion.routes";
import { profileManagementRoutes } from "./profile-management.routes";
import { deviceNotificationRoutes } from "./device-notification.routes";
import { profileSettingsRoutes } from "./profile-settings.routes";

// Re-export RegistrationTokenPayload for backward compatibility
export type { RegistrationTokenPayload } from "./profile-completion.routes";

// Compose all profile routes into a single export
export const profileRoutes = createApp()
  .use(profileCompletionRoutes)
  .use(profileManagementRoutes)
  .use(deviceNotificationRoutes)
  .use(profileSettingsRoutes);

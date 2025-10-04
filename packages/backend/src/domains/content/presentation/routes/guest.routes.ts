// guest.routes.ts
// Orchestrator for all guest-related routes
// Combines session, cart, favorites, and notifications functionality

import { createApp } from "../../../../shared/infrastructure/web/app";

import { guestCartRoutes } from "./guest-cart.routes";
import { guestDeviceTokenRoutes } from "./guest-device-token.routes";
import { guestFavoritesRoutes } from "./guest-favorites.routes";
import { guestNotificationsRoutes } from "./guest-notifications.routes";
import { guestSessionRoutes } from "./guest-session.routes";

export const guestRoutes = createApp().group("/guest", (app) =>
  app
    .use(guestSessionRoutes)
    .use(guestCartRoutes)
    .use(guestFavoritesRoutes)
    .use(guestDeviceTokenRoutes)
    .use(guestNotificationsRoutes)
);

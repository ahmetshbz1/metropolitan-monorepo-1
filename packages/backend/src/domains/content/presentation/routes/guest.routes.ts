// guest.routes.ts
// Orchestrator for all guest-related routes
// Combines session, cart, and favorites functionality

import { createApp } from "../../../../shared/infrastructure/web/app";
import { guestSessionRoutes } from "./guest-session.routes";
import { guestCartRoutes } from "./guest-cart.routes";
import { guestFavoritesRoutes } from "./guest-favorites.routes";

export const guestRoutes = createApp().group("/guest", (app) =>
  app
    .use(guestSessionRoutes)
    .use(guestCartRoutes)
    .use(guestFavoritesRoutes)
);

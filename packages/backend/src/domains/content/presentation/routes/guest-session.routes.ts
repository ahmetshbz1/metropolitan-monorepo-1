// guest-session.routes.ts
// Handles guest session management endpoints
// Creates and manages temporary guest sessions

import { t } from "elysia";

import { guestSessions } from "../../../../shared/infrastructure/database/schema";
import { createApp } from "../../../../shared/infrastructure/web/app";

export const guestSessionRoutes = createApp()
  .post(
    "/session/create",
    async ({ body, db }) => {
      const { guestId, deviceInfo } = body;

      // Expire after 7 days
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Update existing or create new
      await db
        .insert(guestSessions)
        .values({
          guestId,
          deviceInfo: deviceInfo || null,
          expiresAt,
        })
        .onConflictDoUpdate({
          target: [guestSessions.guestId],
          set: {
            lastActivity: new Date(),
            expiresAt,
            deviceInfo: deviceInfo || null,
          },
        });

      return { success: true, guestId, expiresAt };
    },
    {
      body: t.Object({
        guestId: t.String(),
        deviceInfo: t.Optional(t.String()),
      }),
    }
  );
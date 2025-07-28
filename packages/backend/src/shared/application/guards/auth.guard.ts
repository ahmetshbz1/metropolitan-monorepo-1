//  "auth.guard.ts"
//  metropolitan backend
//  Created by Ahmet on 16.06.2025.

import { jwt } from "@elysiajs/jwt";
import { Elysia } from "elysia";

import { isTokenBlacklisted } from "../../infrastructure/database/redis";

export const isAuthenticated = (app: Elysia) =>
  app
    .use(jwt({ name: "jwt", secret: process.env.JWT_SECRET! }))
    .derive(async ({ jwt, headers }) => {
      const token = headers.authorization?.replace("Bearer ", "");
      if (!token) return { profile: null };

      try {
        const isBlacklisted = await isTokenBlacklisted(token);
        if (isBlacklisted) return { profile: null };

        const profile = (await jwt.verify(token)) as
          | { userId: string; exp: number }
          | false;
        if (!profile) {
          return { profile: null };
        }

        return { profile };
      } catch (_error) {
        // Token geçersiz veya süresi dolmuş
        return { profile: null };
      }
    })
    .guard({
      beforeHandle: ({ profile, error }) => {
        if (!profile) {
          return error(401, "Unauthorized");
        }
      },
    });

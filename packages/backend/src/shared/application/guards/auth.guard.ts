//  "auth.guard.ts"
//  metropolitan backend
//  Created by Ahmet on 16.06.2025.

import { jwt } from "@elysiajs/jwt";
import { Elysia } from "elysia";

import { isTokenBlacklisted } from "../../infrastructure/database/redis";

export const isAuthenticated = (app: Elysia) =>
  app
    .use(jwt({ name: "jwt", secret: process.env.JWT_SECRET! }))
    .derive(async ({ jwt, headers, request }) => {
      const token = headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return { profile: null };
      }

      try {
        const isBlacklisted = await isTokenBlacklisted(token);
        if (isBlacklisted) {
          return { profile: null };
        }

        const decoded = (await jwt.verify(token)) as any;
        if (!decoded) {
          return { profile: null };
        }

        // Support both 'sub' (standard JWT) and 'userId' (legacy) fields
        const userId = decoded.sub || decoded.userId;
        if (!userId) {
          console.log("Token missing userId/sub field:", decoded);
          return { profile: null };
        }

        const profile = {
          userId,
          sub: decoded.sub, // Include original sub field for compatibility
          exp: decoded.exp,
          type: decoded.type,
          userType: decoded.userType || "individual",
          sessionId: decoded.sessionId,
          deviceId: decoded.deviceId,
        };

        return { profile };
      } catch (error) {
        // Token geçersiz veya süresi dolmuş
        return { profile: null };
      }
    })
    .guard({
      beforeHandle: ({ profile, set }) => {
        if (!profile) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }
      },
    });

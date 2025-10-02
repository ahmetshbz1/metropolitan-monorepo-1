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

      console.log("🔧 [AUTH DEBUG] Request:", request.method, request.url);
      console.log("🔧 [AUTH DEBUG] Headers:", {
        authorization: headers.authorization ? `Bearer ${headers.authorization.substring(7, 57)}...` : 'none',
        'user-agent': headers['user-agent'],
        'x-platform': headers['x-platform'],
        'x-device-model': headers['x-device-model'],
        'x-app-version': headers['x-app-version'],
      });

      if (!token) {
        console.log("🔧 [AUTH DEBUG] No token provided");
        return { profile: null };
      }

      // Token format kontrolü
      const tokenParts = token.split('.');
      console.log("🔧 [AUTH DEBUG] Token format:", {
        partsCount: tokenParts.length,
        isValidFormat: tokenParts.length === 3,
        firstPart: tokenParts[0]?.substring(0, 20) + '...',
        jwtSecretExists: !!process.env.JWT_SECRET,
        jwtSecretLength: process.env.JWT_SECRET?.length,
      });

      try {
        const isBlacklisted = await isTokenBlacklisted(token);
        if (isBlacklisted) {
          console.log("🔧 [AUTH DEBUG] Token is blacklisted");
          return { profile: null };
        }

        const decoded = (await jwt.verify(token)) as any;
        if (!decoded) {
          console.log("🔧 [AUTH DEBUG] Token verification failed - no decoded payload");
          return { profile: null };
        }

        console.log("🔧 [AUTH DEBUG] Token decoded successfully:", {
          userId: decoded.sub || decoded.userId,
          type: decoded.type,
          exp: decoded.exp,
          deviceId: decoded.deviceId,
        });

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
        console.log("🔧 [AUTH DEBUG] Token verification error:", {
          error: error instanceof Error ? error.message : String(error),
          errorType: error?.constructor?.name,
          stack: error instanceof Error ? error.stack?.substring(0, 200) : undefined,
        });
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

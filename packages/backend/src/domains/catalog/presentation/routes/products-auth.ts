//  "products-auth.ts"
//  metropolitan backend
//  Created by Ahmet on 22.06.2025.

import { jwt } from "@elysiajs/jwt";
import { eq } from "drizzle-orm";

import { isTokenBlacklisted } from "../../../../shared/infrastructure/database/redis";
import { users } from "../../../../shared/infrastructure/database/schema";
import { createApp } from "../../../../shared/infrastructure/web/app";

/**
 * JWT authentication middleware for products endpoints
 * - Token validation
 * - Blacklist check
 * - UserType extraction (hybrid: token first, DB fallback)
 */
export const productsAuthMiddleware = createApp()
  .use(jwt({ name: "jwt", secret: process.env.JWT_SECRET! }))
  .derive(async ({ jwt: jwtInstance, headers, db }) => {
    const token = headers.authorization?.replace("Bearer ", "");
    if (!token) return { profile: null };

    try {
      const isBlacklisted = await isTokenBlacklisted(token);
      if (isBlacklisted) return { profile: null };

      const decoded = (await jwtInstance.verify(token)) as any;
      if (!decoded) return { profile: null };

      const userId = decoded.sub || decoded.userId;
      if (!userId) return { profile: null };

      // Hibrit çözüm: Önce token'a bak, yoksa DB'den çek
      let userType = decoded.userType;

      if (!userType) {
        // Sadece eski token'lar için DB sorgusu
        const user = await db.query.users.findFirst({
          where: eq(users.id, userId),
          columns: { userType: true }
        });

        if (!user) return { profile: null };
        userType = user.userType;
      }

      const profile = {
        userId,
        userType: userType as "individual" | "corporate",
      };

      return { profile };
    } catch (_error) {
      return { profile: null };
    }
  });

//  "admin.guard.ts"
//  metropolitan backend
//  Admin JWT doğrulaması

import { Elysia } from "elysia";

interface AdminProfilePayload {
  sub: string;
  email?: string;
  role?: string;
  type?: string;
}

const isAdminPayload = (payload: unknown): payload is AdminProfilePayload => {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Record<string, unknown>;
  return (
    typeof candidate.sub === "string" &&
    candidate.role === "admin" &&
    candidate.type === "admin-access"
  );
};

export const isAdminAuthenticated = (app: Elysia) =>
  app
    .derive(async (context) => {
      const headers = context.headers as Record<string, string | undefined>;
      const jwtInstance = (context as unknown as {
        jwt: {
          verify: (token: string) => Promise<unknown>;
        };
      }).jwt;
      const token = headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return { admin: null };
      }

      try {
        const decoded = await jwtInstance.verify(token);
        if (!decoded || !isAdminPayload(decoded)) {
          return { admin: null };
        }

        return {
          admin: {
            id: decoded.sub,
            email: typeof decoded.email === "string" ? decoded.email : undefined,
          },
        };
      } catch (error) {
        console.error("Admin token doğrulaması başarısız", error);
        return { admin: null };
      }
    })
    .guard({
      beforeHandle: (context: any) => {
        if (!context.admin) {
          context.set.status = 401;
          return {
            success: false,
            message: "Yetkisiz erişim",
          };
        }
      },
    });

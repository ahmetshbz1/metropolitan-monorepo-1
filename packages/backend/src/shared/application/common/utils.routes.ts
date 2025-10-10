//  "utils.routes.ts"
//  metropolitan backend
//  Created by Ahmet on 04.06.2025.

import { t } from "elysia";

import { verifyNipAndGetName } from "../../infrastructure/external/nip.service";
import { createApp } from "../../infrastructure/web/app";

export const utilsRoutes = createApp().group("/utils", (app) =>
  app
    .post(
      "/client-error-log",
      async ({ body }) => {
        console.log("🔴 CLIENT ERROR LOG:", JSON.stringify(body, null, 2));
        return { success: true };
      },
      {
        body: t.Object({
          source: t.String(),
          error: t.Any(),
        }),
      }
    )
    .post(
      "/check-nip",
    async ({ body, error }) => {
      const { nip } = body;

      const result = await verifyNipAndGetName(nip);

      if (!result.success) {
        // Service'den gelen hata mesajını 400 status ile dön
        return error(
          400,
          result.message || "Invalid NIP or an error occurred."
        );
      }

      // VAT durumu kontrolü - aktif değilse bilgileri göster ama success: false
      if (result.statusVat !== "Czynny") {
        return {
          success: false,
          message:
            "Bu şirket VAT açısından aktif değil. Sadece aktif şirketler kayıt olabilir.",
          data: {
            companyName: result.companyName,
            nip: result.nip,
            statusVat: result.statusVat,
            regon: result.regon,
            krs: result.krs,
            workingAddress: result.workingAddress,
            registrationDate: result.registrationDate,
          },
        };
      }

      return {
        success: true,
        data: {
          companyName: result.companyName,
          nip: result.nip,
          statusVat: result.statusVat,
          regon: result.regon,
          krs: result.krs,
          workingAddress: result.workingAddress,
          registrationDate: result.registrationDate,
        },
      };
    },
    {
      body: t.Object({
        nip: t.String(),
      }),
    }
  )
);

import { eq } from "drizzle-orm";

import { db } from "../../../../../shared/infrastructure/database/connection";
import { companies } from "../../../../../shared/infrastructure/database/schema";

export interface UpdateCompanyInput {
  companyId: string;
  name: string;
  nip: string;
}

export class UpdateCompanyService {
  static async execute(input: UpdateCompanyInput): Promise<{ success: boolean; message: string }> {
    try {
      const { companyId, name, nip } = input;

      const existingCompany = await db
        .select()
        .from(companies)
        .where(eq(companies.id, companyId))
        .limit(1);

      if (existingCompany.length === 0) {
        throw new Error("Şirket bulunamadı");
      }

      await db
        .update(companies)
        .set({
          name,
          nip,
          updatedAt: new Date(),
        })
        .where(eq(companies.id, companyId));

      return {
        success: true,
        message: "Şirket başarıyla güncellendi",
      };
    } catch (error) {
      console.error("UpdateCompanyService error:", error);
      throw error;
    }
  }
}
